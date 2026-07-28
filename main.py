import json

with open("response.txt", "r", encoding="utf-8") as file:
    json_data = json.load(file)

drivers = json_data["data"]["resultList"]

print("إجمالي الـ DAs:", len(drivers))
print("-" * 50)

for da in drivers[:5]:
    print("الاسم:", da.get("fullName"))
    print("الإيميل:", da.get("emailAddress"))
    print("ID:", da.get("providerId"))
    print("الحالة:", da.get("operationalStatus"))
    print("التقدم:", da.get("assignmentStatusRate"))
    print("-" * 50)