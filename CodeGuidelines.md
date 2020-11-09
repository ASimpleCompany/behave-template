# General Coding Guidelines

## Make Your Code Readable
- Use Meaningful Names and Avoid Made-Up Acronyms
- Use verbs for function names and nouns for classes and attributes
- Keep Functions Short and to the Point
- Keep good Indentation and Spacing 
- Make good use of brackets
- Remove unusable code and Unnecessary Comments
- Follow the Conventions (camelCase, underscore_case)
- Use Comments Wisely:
    - **File Header comment example:**
        ```
        Name: Melissa Galloway
        Date: 04.15.17
        Section: CSE 154 AX

        This is the index.html page for my portfolio of web development work. It includes links to side projects I have done during CSE 154, including an AboutMe page, a blog template, and a crytogram generator.
        ```
    - **Function or process comment example:**
        ```
        /**
        * Returns the product of the two given numbers (defined as x * y)
        *
        * @param x - first (number) factor value of returned product
        * @param y - second (number) factor value to returned product
        * @requires x and y are both Number types
        * @returns product of x * y
        */
        function multiply(x, y) {
           return x * y;
        }
        ```
    - **Inline comments:** Inside the interiors of your various functions, if you have sections of code that are lengthy or complex or non-trivial, place a small amount of inline comments near those lines of complex code, describing what they are doing.

## Make Your Code Robust
- Avoid Duplication, use OOP 
- Avoid Hard-Coded Strings and Magic Numbers as much as posible
- Do not reinvent the wheel, use integrated functions from packages
- Implement Log for debugging
- Implement Error handling 
- Write Everything Code-Related in English as much as posible


## More Documentation

[Google Guidelines](https://github.com/google/styleguide)
