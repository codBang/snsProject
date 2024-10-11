import os
import sys
import pyinstaller

def is_user_code_file(file_path):
    excluded_dirs = ['node_modules', 'data']
    for excluded in excluded_dirs:
        if excluded in file_path:
            return False
    return file_path.endswith('.js')

def read_user_code_files(directory):
    user_code_files = {}
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            if is_user_code_file(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    user_code_files[file_path] = f.read()
    return user_code_files

def merge_user_code_files(output_file, user_code_files_content):
    with open(output_file, 'w', encoding='utf-8') as f:
        for file_path, content in user_code_files_content.items():
            relative_path = os.path.relpath(file_path, start=os.path.dirname(output_file))
            f.write(f"{relative_path}:\n```js\n{content}\n```\n\n")

def main():
    directory_path = os.path.expanduser('~/Documents/gobangSTUDIO/wized-server')
    output_file_path = os.path.join(directory_path, 'merge.md')
    
    user_code_files_content = read_user_code_files(directory_path)
    merge_user_code_files(output_file_path, user_code_files_content)

    print(f"Merged user-defined JavaScript files have been written to {output_file_path}.")

if __name__ == "__main__":
    main()