
atlikums = 100
izvele = ""

while izvele != "4":
    print()
    print("1 — apskatīt atlikumu")
    print("2 — iemaksāt naudu")
    print("3 — izņemt naudu")
    print("4 — beigt darbu")

    izvele = input("Izvēlies darbību: ").strip()

    if izvele == "1":
        print(f"Tavs atlikums: {atlikums}")

    elif izvele == "2":
        teksts = input("Cik naudas iemaksāt? ").strip()
        try:
            summa = int(teksts)
        except ValueError:
            print("Kļūda: summai jābūt veselam skaitlim.")
        else:
            if summa <= 0:
                print("Kļūda: summai jābūt lielākai par 0.")
            else:
                atlikums += summa
                print(f"Iemaksāts: {summa}. Jaunais atlikums: {atlikums}")

    elif izvele == "3":
        teksts = input("Cik naudas izņemt? ").strip()
        try:
            summa = int(teksts)
        except ValueError:
            print("Kļūda: summai jābūt veselam skaitlim.")
        else:
            if summa <= 0:
                print("Kļūda: summai jābūt lielākai par 0.")
            elif summa > atlikums:
                print(f"Kļūda: kontā nepietiek naudas. Tavs atlikums: {atlikums}")
            else:
                atlikums -= summa
                print(f"Izņemts: {summa}. Jaunais atlikums: {atlikums}")

    elif izvele == "4":
        print(f"Darbs beigts. Gala atlikums: {atlikums}")

    else:
        print("Kļūda: izvēlies numuru no 1 līdz 4.")