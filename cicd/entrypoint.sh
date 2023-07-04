#!/bin/bash

set -euo pipefail

trap exit_cleanup EXIT ERR SIGINT

exit_cleanup() {
  unset AWS_ACCESS_KEY_ID
  unset AWS_SECRET_ACCESS_KEY
}

p_log() { printf "âžœ $(date '+%H:%M:%S') | %s\n" "$@"
}
p_err() { printf "âœ— $(date '+%H:%M:%S') |   Err: %s\n" "$@" 1>&2 && exit 1
}
p_ok() { printf "âœ“ $(date '+%H:%M:%S') |   OK %s\n" "$@"
}

declare -xr AWS_DEFAULT_OUTPUT="json"
declare -r TIMEOUT=300
declare -r MAX_TASKDEFS=10
declare -x ECS_TASKDEF_FAMILY=""

check_aws_credentials() {
  p_log "Checking AWS credentials."
  vars=("AWS_DEFAULT_REGION" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
  vars_count=0
  for i in "${vars[@]}"
  do
    if [[ -z ${!i+x} ]]; then
      p_err "$i is not set."
      (( vars_count++ ))
    fi
  done
  if ((vars_count > 0)); then
      exit 1
  else
      aws sts get-caller-identity &> /dev/null
  fi
  p_ok
}

check_variables() {
  p_log "Checking necessary variables."
  vars=("ECS_SERVICE_NAME" "ECS_CLUSTER_NAME" "ECR_IMAGE_URI" "ASPNETCORE_ENVIRONMENT" "ECS_CPU" "ECS_MEMORY")
  vars_count=0
  for i in "${vars[@]}"
  do
    if [[ -z ${!i+x} ]]; then
      p_err "$i is not set."
      (( vars_count++ ))
    fi
  done
  if ((vars_count > 0)); then
      exit 1
  fi
  p_ok
}

check_tools() {
  check_aws_credentials
  p_log "Checking necessary tools."
  tools=("jq" "aws")
  tools_count=0
  for i in "${tools[@]}"
  do
    if ! [ -x "$(command -v "$i")" ]; then
      p_err "$i is not installed."
      (( tools_count++ ))
    fi
  done
  if ((tools_count > 0)); then
    exit 1
  fi
  p_ok
}

function get_current_taskdef() {
  p_log "Getting current ECS task definition."
  current_taskdef_arn=$(aws ecs describe-services --services "$ECS_SERVICE_NAME" --cluster "$ECS_CLUSTER_NAME" | jq -r '.services[0].taskDefinition')
#   echo "$current_taskdef_arn"
  current_taskdef=$(aws ecs describe-task-definition --task-definition "$current_taskdef_arn" | jq '.taskDefinition')
#   echo "$current_taskdef"
  last_used_taskdef_arn="$current_taskdef_arn"
  ECS_TASKDEF_FAMILY=$(echo "$current_taskdef" | jq -r '.family')
  p_ok
}

# For allowed values check link
# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html#fargate-tasks-size

function create_new_taskdef() {
  p_log "Creating new task definition."
  taskdef=$(
    echo "$current_taskdef" \
    | jq \
    --arg ecr_uri "${ECR_IMAGE_URI}" \
    --arg env "${ASPNETCORE_ENVIRONMENT}" \
    --arg cpu "${ECS_CPU}" \
    --arg memory "${ECS_MEMORY}" \
    '.containerDefinitions[0].image = $ecr_uri
    | .cpu = $cpu
    | .memory = $memory
    | ( .containerDefinitions[0].environment[]
    | select(.name == "ASPNETCORE_ENVIRONMENT") ).value |= $env' | jq '.')
  jq_filter="
    family: .family, \
    volumes: .volumes, \
    containerDefinitions: .containerDefinitions, \
    placementConstraints: .placementConstraints, \
    networkMode: .networkMode, \
    placementConstraints: .placementConstraints, \
    executionRoleArn: .executionRoleArn, \
    requiresCompatibilities: .requiresCompatibilities, \
    cpu: .cpu, \
    memory: .memory
  "
  new_def=$(echo "$taskdef" | jq "{${jq_filter}}")
  echo "$new_def"
  p_ok
}

function reg_new_taskdef() {
  p_log "Registering new task definition."
  new_taskdef=$(aws ecs register-task-definition --cli-input-json "$new_def" | jq -r .taskDefinition.taskDefinitionArn)
  p_ok
}

function rollback() {
  p_log "Rolling back to ${last_used_taskdef_arn}."
  aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --task-definition $last_used_taskdef_arn > /dev/null
  p_ok
}

function update_ecs() {
  p_log "Updating service."
  update_service_success="false"

  local update=$(aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --task-definition $new_taskdef)
  local service_desiredcount=$(aws ecs describe-services --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME | jq '.services[]|.desiredCount')
  
  if [[ $service_desiredcount -gt 0 ]]; then
    step=10
    i=0
    while [[ $i -lt $TIMEOUT ]]
    do
      running_tasks=$(aws ecs list-tasks --cluster "$ECS_CLUSTER_NAME"  --service-name "$ECS_SERVICE_NAME" --desired-status RUNNING --query taskArns --output text)
      if [[ ! -z $running_tasks ]]; then
        status=$(aws ecs describe-tasks --cluster "$ECS_CLUSTER_NAME" --tasks `aws ecs list-tasks --cluster "$ECS_CLUSTER_NAME"  --service-name "$ECS_SERVICE_NAME" --desired-status RUNNING --query taskArns --output text` \
        | jq ".tasks[]| if .taskDefinitionArn == \"$new_taskdef\" then . else empty end|.lastStatus" \
        | grep -e "RUNNING") || :
      
        if [[ $status ]]; then
          p_ok "${ECS_SERVICE_NAME} updated successfully."

          if [[ $MAX_TASKDEFS -gt 0 ]]; then
            local registered_taskdefs=$(aws ecs list-task-definitions --family-prefix "$ECS_TASKDEF_FAMILY" --status ACTIVE --sort ASC)
            local active_taskdefs=$(echo "$registered_taskdefs" | jq ".taskDefinitionArns|length")
            
            if [[ $active_taskdefs -gt $MAX_TASKDEFS ]]; then
              local last_outdated_index=$(($active_taskdefs - $MAX_TASKDEFS - 1))
              for i in $(seq 0 $last_outdated_index); do
                local outdated_revision_arn=$(echo "$registered_taskdefs" | jq -r ".taskDefinitionArns[$i]")
                p_log "Deregistering outdated task revision: $outdated_revision_arn"
                aws ecs deregister-task-definition --task-definition "$outdated_revision_arn" > /dev/null
              done
            fi

            update_service_success="true"
            break
          fi
        fi
      fi
      sleep $step
      i=$(( $i + $step ))
      p_log "$i waiting for update to complete..."
    done

    if [[ "${update_service_success}" != "true" ]]; then
      rollback
      p_err "new task definition not running within $TIMEOUT seconds"
    fi

  else
    p_err "skipping because $ECS_SERVICE_NAME has desired count <= 0"
  fi
}

function wait_deployment {
  local deployment_success="false"
  local step=5
  local i=0
  while [ $i -lt $TIMEOUT ]
  do
    p_log "Waiting for service deployment status..."
    num_deployments=$(aws ecs describe-services --cluster "${ECS_CLUSTER_NAME}" --service "${ECS_SERVICE_NAME}" | jq "[.services[].deployments[]] | length")

    if [ $num_deployments -eq 1 ]; then
      p_ok "service deployment successful."
      deployment_success="true"
      i=$TIMEOUT
    else
      sleep $step
      i=$(( $i + $step ))
    fi
  done

  if [[ "${deployment_success}" != "true" ]]; then
    rollback
    p_err "service deployment failed."
  fi
}

check_tools
check_variables
get_current_taskdef
create_new_taskdef
reg_new_taskdef
update_ecs
wait_deployment