Feature: Modulo de Reportes
    Como usuario administrativo
    Quiero poder generar reportes de planilla
    Para mantener una mejor gestión del personal

  Scenario: Validar la generación de reportes
    Given se navega a "http://www.icaplanilla.com/login"
    When se accede a la pagina principal
    And se navega a la pantalla de reportes
    Then se espera poder generar el reporte 