

skaitli = [5, 2, 8, 1, 4]

print(f"Sākuma saraksts: {skaitli}")

n = len(skaitli)

for gajiens in range(n - 1):
   
    for i in range(n - 1 - gajiens):
        if skaitli[i] > skaitli[i + 1]:
            
            skaitli[i], skaitli[i + 1] = skaitli[i + 1], skaitli[i]

    print(f"Pēc {gajiens + 1}. cikla: {skaitli}")

print(f"Sakārtotais saraksts: {skaitli}")
