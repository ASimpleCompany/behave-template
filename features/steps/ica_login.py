from behave import given, then, when
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# from environs import Env

# env = Env()
# # Read .env into os.environ
# env.read_env()

# env.bool("DEBUG")  # => True
# env.int("PORT")  # => 4567

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
    try:
        h1_title = WebDriverWait(context.driver, delay).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="root"]/div/div/div/div/div/div[1]/h2')))
    except TimeoutException:
        print('timeout !')
    pass


@when('se muestra la pantalla de "{view}"')
def step(context):


    delay = 10  # seconds
    try:
        h1_title = WebDriverWait(context.driver, delay).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="root"]/div/div/div/div/div/div[1]/h2')))
    except TimeoutException:
        print('timeout !')
    pass
