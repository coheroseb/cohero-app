import sys

def check_brackets(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    stack = []
    line = 1
    col = 1
    for i, char in enumerate(content):
        if char == '\n':
            line += 1
            col = 1
        else:
            col += 1
            
        if char == '{':
            stack.append((line, col))
        elif char == '}':
            if not stack:
                print(f"Extra closing bracket at line {line}, col {col}")
                return
            stack.pop()
            
    if stack:
        print(f"Unclosed brackets: {len(stack)}")
        for l, c in stack:
            print(f"  Opened at line {l}, col {c}")
    else:
        print("Brackets are balanced.")

check_brackets('src/app/mine-materialer/page.tsx')
