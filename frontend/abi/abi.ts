export const BLINDROLL_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "employee",
        type: "address"
      }
    ],
    name: "AlreadyEmployee",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "employee",
        type: "address"
      }
    ],
    name: "EmployeeNotFound",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error"
  },
  {
    inputs: [],
    name: "MaxEmployeesReached",
    type: "error"
  },
  {
    inputs: [],
    name: "NotEmployee",
    type: "error"
  },
  {
    inputs: [],
    name: "NotEmployer",
    type: "error"
  },
  {
    inputs: [],
    name: "PayrollAlreadyRunning",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "handle",
        type: "bytes32"
      },
      {
        internalType: "address",
        name: "sender",
        type: "address"
      }
    ],
    name: "SenderNotAllowedToUseHandle",
    type: "error"
  },
  {
    inputs: [],
    name: "ZamaProtocolUnsupported",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "employee",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    name: "EmployeeAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "employee",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    name: "EmployeeDeactivated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "employee",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    name: "EmployeeReactivated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "addr",
        type: "address"
      }
    ],
    name: "ErrorChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "employeesProcessed",
        type: "uint256"
      }
    ],
    name: "PayrollExecuted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "employee",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    name: "SalaryUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    name: "TreasuryDeposited",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "employee",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    name: "Withdrawal",
    type: "event"
  },
  {
    inputs: [],
    name: "MAX_EMPLOYEES",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "emp",
        type: "address"
      },
      {
        internalType: "externalEuint64",
        name: "encryptedSalary",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes"
      }
    ],
    name: "addEmployee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "confidentialProtocolId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "emp",
        type: "address"
      }
    ],
    name: "deactivateEmployee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "externalEuint64",
        name: "encryptedAmount",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes"
      }
    ],
    name: "depositToTreasury",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "employer",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "executePayroll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "emp",
        type: "address"
      }
    ],
    name: "getEmployeeAddedAt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getEmployeeCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getEmployeeList",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getEncryptedTreasuryBalance",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "emp",
        type: "address"
      }
    ],
    name: "getIsEmployeeActive",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address"
      }
    ],
    name: "getLastError",
    outputs: [
      {
        internalType: "euint8",
        name: "errorCode",
        type: "bytes32"
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getMyEncryptedBalance",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getMyEncryptedSalary",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "emp",
        type: "address"
      }
    ],
    name: "reactivateEmployee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "emp",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amountInWei",
        type: "uint256"
      }
    ],
    name: "setPlainSalaryMirror",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "emp",
        type: "address"
      },
      {
        internalType: "externalEuint64",
        name: "encryptedSalary",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes"
      }
    ],
    name: "updateSalary",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    stateMutability: "payable",
    type: "receive"
  }
]