

ievade = input("Cik skaitļu ievadīsi? ").strip()

try:
    daudzums = int(ievade)
except ValueError:
    
    print("Kļūda: skaitļu skaitam jābūt veselam skaitlim.")
else:
    if daudzums <= 0:
        print("Kļūda: skaitļu skaitam jābūt lielākam par 0.")
    else:
        summa = 0
        pozitivi = 0
        negativi = 0
        nulles = 0
        pari = 0
        nepari = 0
        ievadits = 0

        while ievadits < daudzums:
            teksts = input(f"Ievadi skaitli Nr. {ievadits + 1}: ").strip()

            try:
                skaitlis = int(teksts)
            except ValueError:
                print("Kļūda: jāievada vesels skaitlis. Mēģini vēlreiz.")
                continue

            summa += skaitlis

            if skaitlis > 0:
                pozitivi += 1
            elif skaitlis < 0:
                negativi += 1
            else:
                nulles += 1

            if skaitlis % 2 == 0:
                pari += 1
            else:
                nepari += 1

            ievadits += 1

        videjais = summa / daudzums

        print(f"Summa: {summa}")
        print(f"Pozitīvo skaitļu skaits: {pozitivi}")
        print(f"Negatīvo skaitļu skaits: {negativi}")
        print(f"Nulles vērtību skaits: {nulles}")
        print(f"Pāra skaitļu skaits: {pari}")
        print(f"Nepāra skaitļu skaits: {nepari}")
        print(f"Vidējais aritmētiskais: {videjais:.2f}")