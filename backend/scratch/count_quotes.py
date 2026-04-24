content = open('d:/N4_HK2/PickaloApp/backend/app/services/admin.py').read()
print(f"Total triple quotes: {content.count('\"\"\"')}")
