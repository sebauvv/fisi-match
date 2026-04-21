#!/bin/bash
set -e

echo "1. Empaquetando dependencias de Lambda..."
rm -rf package lambda.zip
mkdir package

# pdfplumber y sus dependencias para Lambda (x86_64, Python 3.10)
pip install pdfplumber \
  --target ./package \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.10 \
  --only-binary=:all:

echo "2. Copiando codigo fuente..."
cp ../script/lambda_function.py ./package/
cp -r ../script/parsers ./package/
mkdir -p ./package/prompts
cp ../prompts/prompt.txt ./package/prompts/

echo "3. Generando lambda.zip..."
cd package
zip -r ../lambda.zip .
cd ..

echo "4. Analizando infraestructura con Terraform..."
terraform plan

echo "El zip fue creado. Para aplicar: terraform apply"
