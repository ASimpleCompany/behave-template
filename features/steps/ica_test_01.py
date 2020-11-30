import time

from behave import *
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


@given('se navega a "{site}"')
def step(context, site):
    context.driver.get(site)
    pass


@when('se accede a la pagina principal')
def step(context):
    WebDriverWait(context.driver, 10).until(EC.element_to_be_clickable(
        (By.XPATH, "//input[@name='username']"))).send_keys('joshua')

    WebDriverWait(context.driver, 10).until(EC.element_to_be_clickable(
        (By.XPATH, "//input[@name='password']"))).send_keys(12345678)

    WebDriverWait(context.driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR,
                                                                        '.btn.btn-block.btn-primary.btn-lg.font-weight-medium.auth-form-btn'))).click()

    h1_title = WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.XPATH, '//*[@id="root"]/div/div/div/div/div/div[1]/h2')))

    assert h1_title


@when('se navega a la pantalla de planilla')
def step(context):

    WebDriverWait(context.driver, 10).until(EC.element_to_be_clickable((By.XPATH,
                                                                        '/html/body/div/div/nav/div/ul[1]/li[3]/a/span'))).click()


@when('se navega a la pantalla de RRHH')
def step(context):

    WebDriverWait(context.driver, 10).until(EC.element_to_be_clickable((By.XPATH,
                                                                        '/html/body/div/div/nav/div/ul[1]/li[2]/a'))).click()


@when('se navega a la pantalla de Administracion')
def step(context):

    WebDriverWait(context.driver, 10).until(EC.element_to_be_clickable((By.XPATH,
                                                                        '/html/body/div/div/nav/div/ul[1]/li[4]/a'))).click()


@then('se espera poder ver la interfaz de pantalla')
def step(context):
    pass
