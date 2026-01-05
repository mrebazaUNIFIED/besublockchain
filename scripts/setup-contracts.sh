#!/bin/bash

# Script para inicializar el proyecto de contratos
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗"
echo -e "║      SETUP DE PROYECTO DE CONTRATOS BESU              ║"
echo -e "╚════════════════════════════════════════════════════════╝${NC}\n"

# Verificar que estamos en el directorio correcto
if [ ! -d "Node-FCI-Boot" ]; then
    echo -e "${YELLOW}⚠️  Ejecuta desde la raíz de besu-network-project/${NC}"
    exit 1
fi

# Crear estructura de directorios
echo -e "${YELLOW}Creando estructura de directorios...${NC}"

if [ -d "contracts" ]; then
    echo -e "${YELLOW}⚠️  Directorio contracts/ ya existe. ¿Sobrescribir? (y/n)${NC}"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Abortado"
        exit 0
    fi
    rm -rf contracts
fi

mkdir -p contracts/{contracts,scripts,test,deployments}

echo -e "${GREEN}✓ Estructura creada${NC}"

# Inicializar proyecto Node.js
echo -e "\n${YELLOW}Inicializando proyecto Node.js...${NC}"
cd contracts

# Crear package.json
cat > package.json << 'EOF'
{
  "name": "fci-besu-contracts",
  "version": "1.0.0",
  "description": "Smart contracts for FCI-Sunwest on Hyperledger Besu",
  "main": "index.js",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy:usfci": "hardhat run scripts/deploy-usfci.js --network besu",
    "deploy:loannft": "hardhat run scripts/deploy-loannft.js --network besu",
    "deploy:all": "hardhat run scripts/deploy-all.js --network besu",
    "verify": "hardhat run scripts/verify-deployment.js --network besu"
  },
  "keywords": ["besu", "blockchain", "smart-contracts", "defi"],
  "author": "FCI",
  "license": "MIT",
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "hardhat": "^2.19.0"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0"
  }
}
EOF

echo -e "${GREEN}✓ package.json creado${NC}"

# Instalar dependencias
echo -e "\n${YELLOW}Instalando dependencias...${NC}"
npm install --silent

echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# Crear hardhat.config.js
echo -e "\n${YELLOW}Creando hardhat.config.js...${NC}"

cat > hardhat.config.js << 'EOF'
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    // Red Besu local (todos los endpoints)
    besu: {
      url: "http://localhost:8547", // FCI RPC1 (principal)
      chainId: 12345,
      accounts: [
        // FCI accounts
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3", // FCI Deployer (0xfe3b557e8fb62b89f4916b721be55ceb828dbd73)
        "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f"  // FCI Secondary (0x627306090abaB3A6e1400e9345bC60c78a8BEf57)
      ],
      gas: 10000000,
      gasPrice: 0, // Gas gratis en red privada
      timeout: 60000
    },

    // Endpoint específico de FCI
    fci: {
      url: "http://localhost:8547", // FCI RPC1
      chainId: 12345,
      accounts: [
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
        "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f"
      ],
      timeout: 60000
    },

    // Endpoint específico de Sunwest
    sunwest: {
      url: "http://localhost:8551", // Sunwest RPC
      chainId: 12345,
      accounts: [
        "0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1", // Sunwest Deployer (0xf17f52151EbEF6C7334FAD080c5704D77216b732)
        "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"  // Sunwest Secondary (0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef)
      ],
      timeout: 60000
    },

    // Para desarrollo/testing con validadores
    validator: {
      url: "http://localhost:8545", // FCI Val1 (interno)
      chainId: 12345,
      accounts: [
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
      ]
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  mocha: {
    timeout: 40000
  }
};
EOF

echo -e "${GREEN}✓ hardhat.config.js creado${NC}"

# Crear .gitignore
cat > .gitignore << 'EOF'
node_modules/
cache/
artifacts/
deployments/*.json
!deployments/.gitkeep
.env
coverage/
typechain/
typechain-types/
EOF

touch deployments/.gitkeep

# Crear README
cat > README.md << 'EOF'
# FCI-Sunwest Smart Contracts

Contratos inteligentes para la red Besu FCI-Sunwest.

## Contratos

- **USFCI.sol**: Stablecoin ERC20 respaldado 1:1 con USD
- **LoanNFT.sol**: Registro de préstamos como NFTs ERC721

## Instalación

```bash
npm install
```

## Compilación

```bash
npm run compile
```

## Deployment

```bash
# Desplegar USFCI (desde Sunwest)
npm run deploy:usfci

# Desplegar LoanNFT (desde FCI)
npm run deploy:loannft

# Desplegar ambos
npm run deploy:all
```

## Testing

```bash
npm test
```

## Verificar Deployment

```bash
npm run verify
```
EOF

echo -e "${GREEN}✓ README.md creado${NC}"

cd ..

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗"
echo -e "║           SETUP COMPLETADO                             ║"
echo -e "╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}Estructura creada:${NC}"
echo "  contracts/"
echo "  ├── contracts/        (Archivos .sol aquí)"
echo "  ├── scripts/          (Scripts de deployment)"
echo "  ├── test/             (Tests)"
echo "  ├── deployments/      (Deployment info)"
echo "  ├── hardhat.config.js"
echo "  ├── package.json"
echo "  └── README.md"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. cd contracts"
echo "  2. Copiar archivos USFCI.sol y LoanNFT.sol a contracts/"
echo "  3. Copiar scripts de deployment a scripts/"
echo "  4. npm run compile"
echo "  5. npm run deploy:all"
echo ""