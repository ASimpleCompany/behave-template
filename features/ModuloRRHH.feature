Feature: Modulo de RRHH
    Como usuario administrativo
    Quiero poder acceder al modulo de RRHH
    Para mantener una mejor gestión del personal

  Scenario: Validar la generación de reportes
    Given se navega a "http://www.icaplanilla.com/login"
    When se accede a la pagina principal
    And se navega a la pantalla de RRHH
    Then se espera poder ver la interfaz de pantalla