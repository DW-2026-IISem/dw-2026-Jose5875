## Bitacora manual de creación del Backend Jose Pinto  

## 1. Crear carpetas padre y permisos
``` bash
/home/josea/ia-lab/dw2026-2/proyects/CelebraHub
josea@Labestia:~/ia-lab/dw2026-2/dw-2026-Jose5875/proyects$ sudo chmod 777 -R CelebraHub/
```
<p align="center">
  <img src="imagenes/carpetas .png">
</p>


---------------------------------------------------------------------------------------------

## 2. instalar nest

Ejecutamos el comando para instalar el nestjs y verificar la version:

``` bash
npm install -g @nestjs/cli
nest --version
```

Verifica la estructura:
<p align="center">
  <img src="imagenes/instalacioon del nst.png">
</p>


---------------------------------------------------------------------------------------------

## 3. Crear proyecto NestJS



``` bash
cd /home/josea/ia-lab/dw2026-2/dw-2026-Jose5875/proyects/CelebraHub/backend_manual
nest new .
cd backend_manual

```


<p align="center">
  <img src="imagenes/instalar njs.png">
</p>



---------------------------------------------------------------------------------------------

## 4. Crear `.env` mínimo (puerto)

``` bash
cat > .env <<'EOF_BACKEND_MANUAL'
PORT=3002
NODE_ENV=development
EOF_BACKEND_MANUAL

```
<p align="center">
  <img src="imagenes/crear .evn.png">
</p>




------------------------------------------------------------------------------

## 5. Dependencias de producción


``` bash
npm install @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport @nestjs/mapped-types \
  passport passport-jwt sequelize sequelize-typescript mysql2 pg tedious oracledb \
  class-validator class-transformer bcrypt reflect-metadata express compression helmet
```

<p align="center">
  <img src="imagenes/dependencia de produccion.png">
</p>


-----------------------------------------------------------------------------------------------

## 6. Dependencias de desarrollo


``` bash

npm install -D @types/bcrypt @types/passport-jwt sequelize-cli

```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

-------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/compilando base.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/compilando base.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v
