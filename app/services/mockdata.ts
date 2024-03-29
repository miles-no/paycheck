import type { Employee } from "~/services/getEmployees.server";
import { randEmail, randFullName, randJobTitle } from "@ngneat/falso";

const randomNumber10to37 = () => Math.floor(Math.random() * 28) + 10;
const randomNumber10000to99999 = () => Math.floor(Math.random() * 89999) + 10000;

const teamLeaders = [
  "Hildegunn",
  "Daniel",
  "Kurt",
]

const randomTeam = () => teamLeaders[Math.floor(Math.random() * teamLeaders.length)];
export const mockedEmployees: Employee[] = Array.from({ length: 51 }, (_, i) =>
  i === 50 ? { // Add a test user for mocking the logged-in user
    description: "Test Testesen",
    code: "999",
    dbId: 999,
    email: "test@miles.no",
    positionValue: { description: "Test" }
  } : {
    description: randFullName(),
    code: `${i + 1}`,
    dbId: i + 1,
    email: randEmail(),
    positionValue: { description: randJobTitle() },
    hoursWorked: randomNumber10to37()+ 5,
    invoicedAmount: randomNumber10000to99999(),
    invoicedHours: randomNumber10to37(),
    nonInvoicableHours: randomNumber10to37(),
    teamLeader: randomTeam(),

  });

export const mockedTimesheets = {
  "data": {
    "timesheets": {
      "pageInfo": {
        "hasNextPage": false,
        "endCursor": "undefined"
      },
      "edges": [
        {
          "cursor": "0",
          "node": {
            "assignmentDate": "2023-01-02",
            "workingHours": "1.0000",
            "invoiceHours": "1.0000",
            "hourlyRevenueCurrency": "1200.0000",
            "projectDbId": 28372116,
            "project": {
              "description": "Lucid Sky MVP",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
 
        {
          "cursor": "12",
          "node": {
            "assignmentDate": "2023-01-11",
            "workingHours": "7.5000",
            "hourlyRevenueCurrency": "1200.0000",
            "projectDbId": 28372116,
            "project": {
              "description": "Lucid Sky MVP",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "13",
          "node": {
            "assignmentDate": "2023-01-12",
            "workingHours": "7.5000",
            "hourlyRevenueCurrency": "1200.0000",
            "projectDbId": 28372116,
            "project": {
              "description": "Lucid Sky MVP",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "14",
          "node": {
            "assignmentDate": "2023-01-13",
            "workingHours": "1.5000",
            "invoiceHours": "1.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "15",
          "node": {
            "assignmentDate": "2023-01-13",
            "workingHours": "6.0000",
            "hourlyRevenueCurrency": "1200.0000",
            "projectDbId": 28372116,
            "project": {
              "description": "Lucid Sky MVP",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "16",
          "node": {
            "assignmentDate": "2023-01-16",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "17",
          "node": {
            "assignmentDate": "2023-01-17",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "18",
          "node": {
            "assignmentDate": "2023-01-18",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "19",
          "node": {
            "assignmentDate": "2023-01-19",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "20",
          "node": {
            "assignmentDate": "2023-01-20",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "21",
          "node": {
            "assignmentDate": "2023-01-23",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "22",
          "node": {
            "assignmentDate": "2023-01-24",
            "workingHours": "9.5000",
            "invoiceHours": "9.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "23",
          "node": {
            "assignmentDate": "2023-01-25",
            "workingHours": "5.5000",
            "invoiceHours": "5.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "24",
          "node": {
            "assignmentDate": "2023-01-25",
            "workingHours": "2.0000",
            "invoiceHours": "2.0000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-009",
              "dbId": 28169035,
              "description": "Møter"
            }
          }
        },
        {
          "cursor": "25",
          "node": {
            "assignmentDate": "2023-01-26",
            "workingHours": "2.0000",
            "invoiceHours": "0.0000",
            "hourlyRevenueCurrency": "0.0000",
            "projectDbId": 28260166,
            "project": {
              "description": "Miles Stavanger - Intern med provisjon/fastpris (Alle)",
              "projectGroup": null
            },
            "activity": {
              "code": "S-103",
              "dbId": 28260221,
              "description": "Bistand innsalg"
            }
          }
        },
        {
          "cursor": "26",
          "node": {
            "assignmentDate": "2023-01-26",
            "workingHours": "5.5000",
            "invoiceHours": "0.0000",
            "hourlyRevenueCurrency": "0.0000",
            "projectDbId": 28260176,
            "project": {
              "description": "Miles Stavanger - Intern uten provisjon (Alle)",
              "projectGroup": null
            },
            "activity": {
              "code": "S-203",
              "dbId": 28260241,
              "description": "Kurs&Konferanse"
            }
          }
        },
        {
          "cursor": "27",
          "node": {
            "assignmentDate": "2023-01-27",
            "workingHours": "1.0000",
            "invoiceHours": "1.0000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "28",
          "node": {
            "assignmentDate": "2023-01-27",
            "workingHours": "6.5000",
            "invoiceHours": "0.0000",
            "hourlyRevenueCurrency": "0.0000",
            "projectDbId": 28260176,
            "project": {
              "description": "Miles Stavanger - Intern uten provisjon (Alle)",
              "projectGroup": null
            },
            "activity": {
              "code": "S-203",
              "dbId": 28260241,
              "description": "Kurs&Konferanse"
            }
          }
        },
        {
          "cursor": "29",
          "node": {
            "assignmentDate": "2023-01-30",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        },
        {
          "cursor": "30",
          "node": {
            "assignmentDate": "2023-01-31",
            "workingHours": "7.5000",
            "invoiceHours": "7.5000",
            "hourlyRevenueCurrency": "1370.0000",
            "projectDbId": 28336822,
            "project": {
              "description": "Code Fusion X",
              "projectGroup": {
                "code": "201"
              }
            },
            "activity": {
              "code": "A-002",
              "dbId": 28168999,
              "description": "Utvikling"
            }
          }
        }
      ]
    }
  }
};
