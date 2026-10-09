

ievade = input("Ievadi savu vecumu: ").strip()

try:
    vecums = int(ievade)
except ValueError:
    # Šeit nonāk gan teksts, gan tukša ievade
    print("Kļūda: vecumam jābūt veselam skaitlim.")
else:
    if vecums < 0:
        print("Kļūda: vecums nevar būt negatīvs.")
    elif vecums <= 12:
        print("bērns")
    elif vecums <= 17:
        print("pusaudzis")
    elif vecums <= 64:
        print("pieaugušais")
    else:
        print("seniors")