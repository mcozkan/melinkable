import sys

def update_app_js():
    with open('static/js/app.js', 'r') as f:
        content = f.read()
    
    # Remove old client initialization
    content = content.replace("const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);", 
        "import {\n  createClient\n} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';\n\nconst supabase = createClient(SUPABASE_URL, SUPABASE_KEY);")
    
    with open('static/js/app.js', 'w') as f:
        f.write(content)

def update_index_html():
    with open('index.html', 'r') as f:
        content = f.read()
        
    # Remove head script
    content = content.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', '')
    
    # Update body script
    content = content.replace('<script src="./static/js/app.js?v=3"></script>', '<script type="module" src="./static/js/app.js?v=4"></script>')
    
    with open('index.html', 'w') as f:
        f.write(content)

update_app_js()
update_index_html()
