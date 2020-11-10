from platform import system

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

#os = Variable que contiene el nombre del sistema operativo
#referencias: https://stackoverflow.com/questions/1854/python-what-os-am-i-running-on
  
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
