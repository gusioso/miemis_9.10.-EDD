

ievade = input("Cik skaitļu ievadīsi? ").strip()

try:
    daudzums = int(ievade)
except ValueError:
    
    print("Kļūda: skaitļu skaitam jābūt veselam skaitlim.")
else:
    if daudzums <= 0:
        print("Kļūda: skaitļu skaitam jābūt lielākam par 0.")
    else:
        mazakais = None
        lielakais = None
        ievadits = 0

        while ievadits < daudzums:
            teksts = input(f"Ievadi skaitli Nr. {ievadits + 1}: ").strip()

            try:
                skaitlis = int(teksts)
            except ValueError:
                print("Kļūda: jāievada vesels skaitlis. Mēģini vēlreiz.")
                continue

            
            if mazakais is None:
                mazakais = skaitlis
                lielakais = skaitlis
            else:
                if skaitlis < mazakais:
                    mazakais = skaitlis
                if skaitlis > lielakais:
                    lielakais = skaitlis

            ievadits += 1

        print(f"Mazākais skaitlis: {mazakais}")
        print(f"Lielākais skaitlis: {lielakais}")