import re

files_to_clean = ["app/page.tsx", "app/onboarding/page.tsx", "app/login/page.tsx", "app/register/page.tsx"]

for filepath in files_to_clean:
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Remove GlowBackground import and component
        content = re.sub(r'import \{ GlowBackground \}.*\n', '', content)
        content = re.sub(r'\s*<GlowBackground />\n', '\n', content)
        
        # Replace neon greens with teal
        content = content.replace('#00e676', '#0f766e')
        content = content.replace('bg-emerald-600', 'bg-teal-600')
        content = content.replace('text-white', 'text-slate-900')
        content = content.replace('border-white', 'border-slate-300')
        content = content.replace('border-[rgba(255,255,255,0.1)]', 'border-slate-300')
        content = content.replace('border-[rgba(255,255,255,0.08)]', 'border-slate-300')
        content = content.replace('bg-[#050a0e]', 'bg-slate-50')
        content = content.replace('bg-[#030608]', 'bg-white')
        content = content.replace('text-slate-400', 'text-slate-600')
        content = content.replace('text-slate-300', 'text-slate-700')
        content = content.replace('text-slate-500', 'text-slate-500')
        content = content.replace('ring-white/10', 'ring-slate-200')
        content = content.replace('bg-black', 'bg-slate-100')
        content = content.replace('text-[#050a0e]', 'text-white')

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Cleaned {filepath}")
    except FileNotFoundError:
        print(f"File not found: {filepath}")

