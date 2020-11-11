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
    # Select Elements from DOM
    username = context.driver.find_element_by_xpath("//input[@name='username']")
    password = context.driver.find_element_by_xpath("//input[@name='password']")
    button = context.driver.find_element_by_css_selector('.btn.btn-block.btn-primary.btn-lg.font-weight-medium.auth-form-btn')

    # Fill out the log in form 
    username.send_keys('{}'.format('joshua'))
    password.send_keys('{}'.format(12345678))
    button.click()

    delay = 10  # seconds
    h1_title = WebDriverWait(context.driver, delay).until(
        EC.presence_of_element_located((By.XPATH, '//*[@id="root"]/div/div/div/div/div/div[1]/h2')))
    
    assert h1_title




@when('se navega a la pantalla de reportes')
def step(context):
    delay = 10  # seconds

    button = WebDriverWait(context.driver, delay).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="root"]/div/nav/div/ul[1]/li[3]/a/span')))    
    button.click()

    button = WebDriverWait(context.driver, delay).until(
        EC.presence_of_element_located((By.XPATH, '//*[@id="sidebar"]/ul/li[4]/div/span')))
    button.click()

    button = WebDriverWait(context.driver, delay).until(
    EC.presence_of_element_located((By.XPATH, '//*[@id="sidebar"]/ul/li[4]/ul/li[2]/a')))
    button.click()

    button = WebDriverWait(context.driver, delay).until(
    EC.presence_of_element_located((By.XPATH, '//*[@id="root"]/div/div/div/div/div/div[2]/div/div/div/div/div[5]/table/tbody/tr[1]/td[6]/div/button')))
    button.click()

    # Wait for 5 seconds
    time.sleep(5)
