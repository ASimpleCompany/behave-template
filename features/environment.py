from selenium import webdriver
from platform import system
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options


def before_all(context):
    os = system()
    chromeOptions = Options()    
    chromeOptions.headless = False
    #chromeOptions.headless = True

    if os == 'Linux':
        context.driver = webdriver.Chrome(executable_path='./chromedriver',chrome_options=chromeOptions)

    if os == 'Darwin':
        context.driver = webdriver.Chrome(ChromeDriverManager().install())      
        
    context.driver.implicitly_wait(10)


def after_all(context):
    context.driver.close()
