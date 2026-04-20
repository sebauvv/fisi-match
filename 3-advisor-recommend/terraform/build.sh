#!/bin/bash
set -e

echo "1. Empaquetando dependencias de Lambda..."
rm -rf package lambda.zip
mkdir package
# Instala los requirements en la carpeta "package"

# asegura que requirements.txt contenga "psycopg2-binary" en vez de "psycopg2".
pip install -r ../script/requirements.txt \
  --target ./package \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.10 \
  --only-binary=:all:

echo "2. Copiando codigo fuente..."
echo "2. Copiando codigo fuente..."
cp -r ../script/*.py ./package/
cp -r ../prompts ./package/

echo "3. Generando lambda.zip..."
cd package
zip -r ../lambda.zip .
cd ..

echo "4. Analizando infraestructura con Terraform..."
terraform plan

echo "El zip fue creado."
