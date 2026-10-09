

skaitli = [4, 7, 2, 9, 7, 1]

ievade = input("Ievadi meklējamo skaitli: ").strip()

try:
    meklejamais = int(ievade)
except ValueError:
    
    print("Kļūda: jāievada vesels skaitlis.")
else:
    pirmais_indekss = -1
    visi_indeksi = []

    for indekss in range(len(skaitli)):
        if skaitli[indekss] == meklejamais:
            if pirmais_indekss == -1:
                pirmais_indekss = indekss
            visi_indeksi.append(indekss)

    if pirmais_indekss == -1:
        print("Nav atrasts")
    else:
        print(f"Pirmais indekss, kurā skaitlis {meklejamais} atrasts: {pirmais_indekss}")
        print(f"Visi indeksi, kuros skaitlis atrasts: {visi_indeksi}")
