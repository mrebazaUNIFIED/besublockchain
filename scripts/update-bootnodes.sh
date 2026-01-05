#!/bin/bash

# Script para actualizar el enode del bootnode en todos los config.toml
# Ejecutar DESPUÉS de iniciar el bootnode

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Actualizando Enodes en Config.toml${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verificar si el bootnode está corriendo
if ! pgrep -f "Node-FCI-Boot" > /dev/null; then
    echo -e "${RED}✗ El bootnode no está corriendo${NC}"
    echo -e "${YELLOW}Inicia primero el bootnode con:${NC}"
    echo -e "  cd Node-FCI-Boot"
    echo -e "  nohup besu --config-file=config.toml > besu.log 2>&1 &"
    echo -e "  cd .."
    exit 1
fi

echo -e "${YELLOW}Esperando 5 segundos para que el bootnode esté listo...${NC}"
sleep 5

# Obtener enode del bootnode desde sus logs
echo -e "${YELLOW}Buscando enode del bootnode en logs...${NC}"

BOOTNODE_ENODE=""
MAX_ATTEMPTS=10
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # Buscar en logs el enode
    if [ -f "Node-FCI-Boot/besu.log" ]; then
        BOOTNODE_ENODE=$(grep -o 'enode://[a-f0-9]\{128\}@[0-9.]\+:[0-9]\+' Node-FCI-Boot/besu.log | head -1)
        
        if [ ! -z "$BOOTNODE_ENODE" ]; then
            break
        fi
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -e "${YELLOW}  Intento $ATTEMPT/$MAX_ATTEMPTS...${NC}"
    sleep 2
done

if [ -z "$BOOTNODE_ENODE" ]; then
    echo -e "${RED}✗ No se pudo obtener el enode del bootnode${NC}"
    echo -e "${YELLOW}Búscalo manualmente en Node-FCI-Boot/besu.log${NC}"
    echo -e "${YELLOW}Debe verse como: enode://abc123...@127.0.0.1:30303${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Enode encontrado:${NC}"
echo -e "  ${BLUE}$BOOTNODE_ENODE${NC}\n"

# Lista de nodos que necesitan actualizar su bootnode
NODES=(
    "Node-FCI-Val1"
    "Node-FCI-Val2"
    "Node-FCI-RPC1"
    "Node-FCI-RPC2"
    "Node-Sunwest-Val1"
    "Node-Sunwest-Val2"
    "Node-Sunwest-RPC"
)

echo -e "${YELLOW}Actualizando config.toml de cada nodo...${NC}\n"

for NODE in "${NODES[@]}"; do
    CONFIG_FILE="$NODE/config.toml"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}✗ No encontrado: $CONFIG_FILE${NC}"
        continue
    fi
    
    # Hacer backup
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
    
    # Reemplazar el bootnode usando sed
    # Busca líneas que contienen bootnodes= y reemplaza el enode
    sed -i "s|bootnodes=\[\"enode://[^\"]*\"\]|bootnodes=[\"$BOOTNODE_ENODE\"]|g" "$CONFIG_FILE"
    
    echo -e "${GREEN}✓ Actualizado: $NODE/config.toml${NC}"
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Enodes Actualizados Correctamente${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Bootnode configurado:${NC}"
echo -e "  $BOOTNODE_ENODE\n"

echo -e "${YELLOW}Próximos pasos:${NC}"
echo -e "  1. Los nodos ahora pueden conectarse al bootnode"
echo -e "  2. Inicia el resto de nodos: ${BLUE}./scripts/start-network.sh${NC}"
echo -e "  3. O continúa iniciándolos manualmente\n"

echo -e "${BLUE}Backups guardados en:${NC}"
for NODE in "${NODES[@]}"; do
    if [ -f "$NODE/config.toml.backup" ]; then
        echo -e "  • $NODE/config.toml.backup"
    fi
done
echo ""