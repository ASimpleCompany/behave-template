from platform import system
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities


def before_feature(context, feature):
    os = system()
    chrome_options = Options()
    chrome_options.headless = True
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-setuid-sandbox")
    chrome_options.add_argument("start-maximized")
    chrome_options.add_argument("disable-infobars")
    
    CHROME_EXE_PATH='./chromedriver'
    
    #aqui es el error
    context.driver = webdriver.Chrome(
    executable_path=CHROME_EXE_PATH,
    chrome_options=chrome_options)
   
    context.driver.implicitly_wait(10)


def after_feature(context, feature):
    context.driver.close()
