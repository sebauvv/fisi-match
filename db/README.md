# db/ - Modulo de Base de Datos

PostgreSQL + pgvector para almacenar los vectores semanticos generados en Fase 2.

## Modos de operacion

| Modo | Infraestructura | Costo | Uso |
|---|---|---|---|
| Local | Docker (`pgvector/pgvector:pg16`) | $0 | Desarrollo y pruebas |
| Cloud | RDS `db.t3.micro` (Terraform) | ~$0.017/hr | Produccion y Lambda |

## Uso local (Docker)

```bash
docker compose up -d

# dependencias del seed
cd seed
pip install -r requirements.txt
cp .env.example .env

# seed la DB desde los JSONs de Fase 1 y 2
python seed.py

# para limpiar y re-poblar
python seed.py --clear
```

La DB queda accesible en `localhost:5433` con usuario `advisor_user`.

## Uso cloud (RDS)

```bash
# crea RDS
cd terraform
terraform init
terraform apply -var="db_password=TU_PASSWORD"

# aplica schema manualmente
psql -h ENDPOINT -U advisor_user -d advisors_db -f ../schema.sql

# para poblar
cd ../seed
# para editar .env con DB_MODE=cloud y credenciales RDS
python seed.py
```

## Schema

Dos tablas definidas en `schema.sql`:

- **advisors**: metadata relacional (id, nombre, ORCID, areas)
- **knowledge_vectors**: vectores 1024d con indice HNSW para kNN coseno

El indice HNSW (`m=16, ef_construction=64`) acelera la busqueda de similitud sobre los 2311 vectores.
