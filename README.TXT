# Clinica StandAlone - Modular

Sistema modular para la gestión de citas en una clínica, dividido en un backend (Laravel) y un frontend (Angular).

## Estructura del proyecto
- **`api-backend`**: Backend desarrollado en Laravel. Maneja la API para gestionar citas, autenticación y datos de la clínica.
- **`1stand`**: Frontend desarrollado en Angular. Proporciona una interfaz para programar y visualizar citas.

## Requisitos
- **Backend**:
  - PHP >= 8.0
  - Composer
  - MySQL o cualquier base de datos compatible con Laravel
- **Frontend**:
  - Node.js >= 16.x
  - Angular CLI

## Instalación
1. **Backend**:
   - Navegá a `api-backend`.
   - Ejecutá `composer install` para instalar las dependencias.
   - Configurá tu archivo `.env` con la conexión a la base de datos.
   - Ejecutá `php artisan migrate` para crear las tablas.
   - Iniciá el servidor con `php artisan serve` (por defecto en `http://localhost:8000`).
2. **Frontend**:
   - Navegá a `1stand`.
   - Ejecutá `npm install` para instalar las dependencias.
   - Iniciá el servidor con `ng serve` (por defecto en `http://localhost:4200`).

## Uso
- Accedé al frontend en `http://localhost:4200` para programar y visualizar citas.
- El backend responde a las solicitudes en `http://localhost:8000/api`.

## Contribuir
¡Si querés contribuir, hacé un fork del repositorio y enviá un pull request con tus cambios!

## Licencia
[Elegí una licencia, por ejemplo, MIT License]

NO OLVIDES TU WAMP O XAMPP, YO UTILIZE WAMP + MYSQL_WORKBENCH