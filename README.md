# ICAPlanilla - Tests
Este repositorio desarrolla pruebas automatizadas mediante el uso del lenguaje `Python`, a través `Behave` como herramiente de BDD (Behavior Driven Development), además de `Gherkin` como lenguaje de definición de casos de prueba, y `Selenium` como automatizador de Navegadores Web. 

**Nota:** *Toda la arquitectura del programa se encuentra dockerizada.*

## Guía de Inicio Rápido

### Define las variables de entorno 

Crea un archivo .env basado en el archivo de referencia dentro del repositorio llamado .env.example. Luego de esto, para arrancar el proyecto ejecuta los siguientes pasos:

### Crear entorno virtual
```
python3 -m venv .venv
```

### Activar entorno virtual
```
source .venv/bin/activate
```

### Instalar dependencias dentro del entorno virtual
```
python3 -m pip install -r requirements.txt
```

### Ejecutar Proyecto
```
python3 -m behave
```

### Desactivar entorno virtual
```
deactivate
```

## Referencias
https://www.techbeamers.com/navigation/
