
PAREIZA_PAROLE = "kokos123"
MAKS_MEGINAJUMI = 3

megainajumi = 0
piekluve = False

while megainajumi < MAKS_MEGINAJUMI and not piekluve:
    ievade = input("Ievadi paroli: ")
    megainajumi += 1

    if ievade == PAREIZA_PAROLE:
        piekluve = True
    else:
        atlicis = MAKS_MEGINAJUMI - megainajumi
        if atlicis > 0:
            print(f"Nepareiza parole. Atlikušie mēģinājumi: {atlicis}")

if piekluve:
    print("Piekļuve atļauta")
else:
    print("Piekļuve bloķēta")