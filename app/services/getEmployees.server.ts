import { cache } from "~/cache";

/**
 * Get employees from Xledger
 *
 * Only current employees are included. The filter is:
 *  - employmentFrom_lte: today - Means that the employee was employed before -or on, today
 *  - employmentTo: null - Means that the employee is still employed
 *  - code_gt: "0" - Code is the employeeNumber. We filter out users that haven't been assigned an employeeNumber
 */
export const getEmployees = async () => {
  // Todo: get access to employees token

  let employees: Employee[] = [];
  let hasNextPage = true;
  let endCursor = null;

  const from = new Date();
  from.setDate(1);
  const formattedFrom = from.toISOString().split("T")[0]; // 2021-03-01

  // Check cache first
  if (cache.has("employees")) {
    console.log("Using cached employees");
    return cache.get("employees") as Employee[];
  }

  while (hasNextPage) {
    try {
      const response = await fetch(`${process.env.XLEDGER_GRAPHQL_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${process.env.XLEDGER_TOKEN}`,
        },
        body: JSON.stringify({
          query: `
            query GetEmployees($first: Int!, $after: String) {
              employees(first: $first, after: $after, filter:{employmentFrom_lte:"${formattedFrom}",employmentTo:null,code_gt:"0"}) {
                pageInfo{hasNextPage}
                edges {
                  cursor
                  node {
                    description
                    code
                    dbId
                    email
                    positionValue{
                      description
                    }
                  }
                }
              }
            }
          `,
          variables: { first: 500, after: endCursor },
        }),
      });

      const json: EmployeeResponse = await response.json();
      employees = [
        ...employees,
        ...json.data.employees.edges.map((edge) => edge.node),
      ];
      hasNextPage = json.data.employees.pageInfo.hasNextPage;
      endCursor = json.data.employees.pageInfo.endCursor;
    } catch (error) {
      console.error(error);
    }
  }
  const sortedEmployees = employees.sort((a, b) => {
    // abcdefghijklmnopqrstuvwxyzæøå
    const aName = a.description.toLowerCase();
    const bName = b.description.toLowerCase();
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return 0;
  });
  await cache.set("employees", sortedEmployees);
  return sortedEmployees;
};

// Types
type EmployeeResponse = {
  errors?: Error[];
  data: EmployeeData;
};
type EmployeeData = {
  employees: EmployeeConnection;
};
type EmployeeConnection = {
  edges: [EmployeeEdge];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
};

type EmployeeEdge = {
  cursor: String;
  node: Employee;
};

export type Employee = {
  description: string;
  positionValue: {
    description: string;
  };
  code: string;
  dbId: number;
};

interface employeeNode {
  node: {
    description: string;
    code: string;
    dbId: number;
    email: string;
    positionValue?: {
      description?: string;
    };
  };
  cursor: string;
}

/**
 * Token is not allowed to query employees, so I'm just returning a dump
 */
export const getEmployeeDump = async () => {
  const data: {
    data: {
      employees: {
        pageInfo: {
          hasNextPage: boolean;
        };
        edges: employeeNode[];
      };
    };
    errors?: Error[];
  } = {
    data: {
      employees: {
        pageInfo: {
          hasNextPage: false,
        },
        edges: [
          {
            node: {
              description: "Bjørn Nordgulen",
              code: "015",
              dbId: 4371336,
              email: "bjorn.nordgulen@miles.no",
              positionValue: null,
            },
            cursor: "4371336",
          },
          {
            node: {
              description: "Stig Ottosen",
              code: "016",
              dbId: 4371337,
              email: "stig.ottosen@miles.no",
              positionValue: {
                description: "Employee",
              },
            },
            cursor: "4371337",
          },
          {
            node: {
              description: "Thomas Bærheim",
              code: "001",
              dbId: 4371340,
              email: "thomas@miles.no",
              positionValue: {
                description: "Driftsdirektør",
              },
            },
            cursor: "4371340",
          },
          {
            node: {
              description: "Kjetil Weibell Husebø",
              code: "012",
              dbId: 4371343,
              email: "kjetil.husebo@miles.no",
              positionValue: {
                description: "Employee",
              },
            },
            cursor: "4371343",
          },
          {
            node: {
              description: "Thorfinn Sørensen",
              code: "013",
              dbId: 4371344,
              email: "thorfinn.sorensen@miles.no",
              positionValue: {
                description: "Employee",
              },
            },
            cursor: "4371344",
          },
          {
            node: {
              description: "Sigurd Gimre",
              code: "005",
              dbId: 4371348,
              email: "sigurd.gimre@miles.no",
              positionValue: {
                description: "Employee",
              },
            },
            cursor: "4371348",
          },
          {
            node: {
              description: "Tor-Erik Hauge",
              code: "006",
              dbId: 4371349,
              email: "tor-erik.hauge@miles.no",
              positionValue: {
                description: "Employee",
              },
            },
            cursor: "4371349",
          },
          {
            node: {
              description: "Nils Jørgen Kvam Mittet",
              code: "007",
              dbId: 4371350,
              email: "nils.jorgen.mittet@miles.no",
              positionValue: {
                description: "Employee",
              },
            },
            cursor: "4371350",
          },
          {
            node: {
              description: "Jarle Friestad",
              code: "008",
              dbId: 4371351,
              email: "jarle.friestad@miles.no",
              positionValue: {
                description: "Employee",
              },
            },
            cursor: "4371351",
          },
          {
            node: {
              description: "Siri Pedersen",
              code: "020",
              dbId: 13555141,
              email: "siri.pedersen@miles.no",
              positionValue: null,
            },
            cursor: "13555141",
          },
          {
            node: {
              description: "Daniel Selvik",
              code: "019",
              dbId: 13674606,
              email: "daniel.selvik@miles.no",
              positionValue: null,
            },
            cursor: "13674606",
          },
          {
            node: {
              description: "Kristian Hiim",
              code: "021",
              dbId: 13674668,
              email: "kristian.hiim@miles.no",
              positionValue: null,
            },
            cursor: "13674668",
          },
          {
            node: {
              description: "Bjørn Taranger",
              code: "018",
              dbId: 13675474,
              email: "bjorn.asle.taranger@miles.no",
              positionValue: null,
            },
            cursor: "13675474",
          },
          {
            node: {
              description: "Bradley Hughes",
              code: "017",
              dbId: 13676329,
              email: "bradley.hughes@miles.no",
              positionValue: null,
            },
            cursor: "13676329",
          },
          {
            node: {
              description: "Stig Rune Malterud",
              code: "022",
              dbId: 15458116,
              email: "stig.rune.malterud@miles.no",
              positionValue: null,
            },
            cursor: "15458116",
          },
          {
            node: {
              description: "Sveinung Dalatun",
              code: "023",
              dbId: 15924223,
              email: "sveinung.dalatun@miles.no",
              positionValue: null,
            },
            cursor: "15924223",
          },
          {
            node: {
              description: "Ådne Tobiesen",
              code: "033",
              dbId: 16519788,
              email: "adne.tobiesen@miles.no",
              positionValue: null,
            },
            cursor: "16519788",
          },
          {
            node: {
              description: "Mads Tordal",
              code: "024",
              dbId: 16689034,
              email: "mads.tordal@miles.no",
              positionValue: null,
            },
            cursor: "16689034",
          },
          {
            node: {
              description: "Kamilla Emilie Davidsen",
              code: "026",
              dbId: 17297631,
              email: "kamilla.emilie.davidsen@miles.no",
              positionValue: null,
            },
            cursor: "17297631",
          },
          {
            node: {
              description: "Hildegunn Hagen",
              code: "025",
              dbId: 17651008,
              email: "hildegunn.hagen@miles.no",
              positionValue: null,
            },
            cursor: "17651008",
          },
          {
            node: {
              description: "Jone Lura",
              code: "031",
              dbId: 18645563,
              email: "jone.lura@miles.no",
              positionValue: {
                description: "Senior Consultant",
              },
            },
            cursor: "18645563",
          },
          {
            node: {
              description: "Eivinn Hustveit",
              code: "032",
              dbId: 18645795,
              email: "eivinn.hustveit@miles.no",
              positionValue: {
                description: "Senior Consultant",
              },
            },
            cursor: "18645795",
          },
          {
            node: {
              description: "Anders Lima",
              code: "034",
              dbId: 21001777,
              email: "anders.lima@miles.no",
              positionValue: null,
            },
            cursor: "21001777",
          },
          {
            node: {
              description: "Ådne Aarthun Jacobsen",
              code: "037",
              dbId: 21751971,
              email: "adne.jacobsen@miles.no",
              positionValue: null,
            },
            cursor: "21751971",
          },
          {
            node: {
              description: "Rohnny Moland",
              code: "035",
              dbId: 21752083,
              email: "rohnny.moland@miles.no",
              positionValue: null,
            },
            cursor: "21752083",
          },
          {
            node: {
              description: "Kurt Andre Askeland",
              code: "036",
              dbId: 21752182,
              email: "kurt.andre.askeland@miles.no",
              positionValue: null,
            },
            cursor: "21752182",
          },
          {
            node: {
              description: "Jarle Salhus Eriksen",
              code: "038",
              dbId: 22735272,
              email: "jarle.s.eriksen@miles.no",
              positionValue: null,
            },
            cursor: "22735272",
          },
          {
            node: {
              description: "Gudsteinn Arnarson",
              code: "040",
              dbId: 23437544,
              email: "gudsteinn.arnarson@miles.no",
              positionValue: null,
            },
            cursor: "23437544",
          },
          {
            node: {
              description: "Stian Grønås",
              code: "039",
              dbId: 23437560,
              email: "stian.gronas@miles.no",
              positionValue: null,
            },
            cursor: "23437560",
          },
          {
            node: {
              description: "Kamilla Nyborg Gregertsen",
              code: "043",
              dbId: 23579433,
              email: "kamilla.nyborg@miles.no",
              positionValue: null,
            },
            cursor: "23579433",
          },
          {
            node: {
              description: "Torstein Taksdal",
              code: "044",
              dbId: 23579518,
              email: "torstein.taksdal@miles.no",
              positionValue: null,
            },
            cursor: "23579518",
          },
          {
            node: {
              description: "Rolf Jacob Dramdal",
              code: "042",
              dbId: 23834866,
              email: "rolf.dramdal@miles.no",
              positionValue: null,
            },
            cursor: "23834866",
          },
          {
            node: {
              description: "Leiv Halvor Lauvsnes",
              code: "045",
              dbId: 25113720,
              email: "leiv.halvor.lauvsnes@miles.no",
              positionValue: null,
            },
            cursor: "25113720",
          },
          {
            node: {
              description: "Morten Salte",
              code: "047",
              dbId: 25455229,
              email: "morten.salte@miles.no",
              positionValue: {
                description: "Senior Consultant",
              },
            },
            cursor: "25455229",
          },
          {
            node: {
              description: "Svein Ormel",
              code: "048",
              dbId: 25763602,
              email: "svein.ormel@miles.no",
              positionValue: null,
            },
            cursor: "25763602",
          },
          {
            node: {
              description: "Gorm-Erik Aarsheim",
              code: "049",
              dbId: 25988437,
              email: "gorm.aarsheim@miles.no",
              positionValue: null,
            },
            cursor: "25988437",
          },
          {
            node: {
              description: "Daniel Meling Bratteli",
              code: "050",
              dbId: 25989430,
              email: "daniel.bratteli@miles.no",
              positionValue: null,
            },
            cursor: "25989430",
          },
          {
            node: {
              description: "Trond Atle Eskeland",
              code: "051",
              dbId: 26275105,
              email: "trond.eskeland@miles.no",
              positionValue: null,
            },
            cursor: "26275105",
          },
          {
            node: {
              description: "Ingrid Lindaas",
              code: "053",
              dbId: 26476162,
              email: "ingrid.lindaas@miles.no",
              positionValue: null,
            },
            cursor: "26476162",
          },
          {
            node: {
              description: "Quentin Lauv",
              code: "052",
              dbId: 26610140,
              email: "quentin.lauv@miles.no",
              positionValue: null,
            },
            cursor: "26610140",
          },
          {
            node: {
              description: "Mauricio Londono",
              code: "055",
              dbId: 26838998,
              email: "mauricio.londono@miles.no",
              positionValue: null,
            },
            cursor: "26838998",
          },
          {
            node: {
              description: "Henry Sjøen",
              code: "054",
              dbId: 26839556,
              email: "henry.sjoen@miles.no",
              positionValue: null,
            },
            cursor: "26839556",
          },
          {
            node: {
              description: "Ove Kristian Jørgensen",
              code: "057",
              dbId: 27146057,
              email: "ove.kristian.jorgensen@miles.no",
              positionValue: null,
            },
            cursor: "27146057",
          },
          {
            node: {
              description: "Marius Sørensen",
              code: "056",
              dbId: 27146586,
              email: "marius.sorensen@miles.no",
              positionValue: null,
            },
            cursor: "27146586",
          },
          {
            node: {
              description: "Thomas Storm Dahl",
              code: "058",
              dbId: 27146923,
              email: "thomas.storm.dahl@miles.no",
              positionValue: null,
            },
            cursor: "27146923",
          },
          {
            node: {
              description: "Bjørn Wigdel",
              code: "062",
              dbId: 28206807,
              email: "bjorn.wigdel@miles.no",
              positionValue: null,
            },
            cursor: "28206807",
          },
          {
            node: {
              description: "Jens Hittenkofer",
              code: "060",
              dbId: 28206886,
              email: "jens.hittenkofer@miles.no",
              positionValue: null,
            },
            cursor: "28206886",
          },
          {
            node: {
              description: "Jozef Johannes Lijnen",
              code: "061",
              dbId: 28207014,
              email: "joep.lijnen@miles.no",
              positionValue: null,
            },
            cursor: "28207014",
          },
          {
            node: {
              description: "Jan Gunnar Helgeland",
              code: "063",
              dbId: 30389870,
              email: "jan.gunnar.helgaland@miles.no",
              positionValue: null,
            },
            cursor: "30389870",
          },
        ],
      },
    },
  };
  return data;
};
