import sys

def check_brackets_at_line(filename, target_line):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    content = "".join(lines[:target_line])
    
    stack = []
    for line_num, line in enumerate(lines[:target_line], 1):
        for col_num, char in enumerate(line, 1):
            if char == '{':
                stack.append((line_num, col_num))
            elif char == '}':
                if not stack:
                    print(f"Extra closing bracket at line {line_num}, col {col_num}")
                else:
                    stack.pop()
            
    print(f"Open brackets at line {target_line}: {len(stack)}")
    for l, c in stack:
        print(f"  Opened at line {l}, col {c}")

check_brackets_at_line('src/app/mine-materialer/page.tsx', 490)
