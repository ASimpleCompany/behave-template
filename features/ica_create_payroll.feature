Feature: Modulo de Gestion de planilla
    Como usuario administrativo
    Quiero poder generar la planilla de los colaboradores
    Para saber cuanto debe ser devengado

  Scenario: Iniciar sesion
    Given se navega a "http://www.icaplanilla.com/login"
    When se accede a la pagina principal
    Then se muestra la pnatalla de "inicio"
