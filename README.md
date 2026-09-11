# Disposizione banchi

Applicazione web per creare una disposizione casuale dei banchi per una classe.

## Funzioni principali

- aggiungere studenti con nome e cognome
- mantenere la classe salvata nel browser tra le aperture dell'app
- caricare e scaricare un file JSON completo per ogni classe dell'istituto
- generare una disposizione randomica in base ai banchi disponibili
- configurare la griglia e selezionare solo i banchi realmente presenti in aula
- posizionare una cattedra larga due celle
- sistemare manualmente i banchi dopo la generazione, mantenendo lo studente agganciato
- scegliere se stampare solo nomi, solo cognomi o entrambi
- stampare la vista dalla cattedra e la vista opposta
- layout pronti per la stampa su carta

## Come usare

1. Apri il file `index.html` nel browser, oppure avvia un server locale.
2. Inserisci gli studenti, le righe, le colonne e il nome della classe.
3. Clicca su "Esporta file classe" per salvare la configurazione in un JSON dedicato.
4. Quando riprendi il lavoro, clicca su "Carica file classe" e seleziona il JSON della classe.
5. Clicca su "Modifica banchi" e seleziona le celle occupate dai banchi.
6. Clicca su "Posiziona cattedra" e seleziona la sua posizione nell'aula.
7. Clicca su "Genera disposizione casuale".
8. Se serve correggere gli abbinamenti, clicca su "Sistemazione manuale" e trascina i banchi: lo studente resta agganciato.
9. Usa l'anteprima PDF o i pulsanti di stampa per ottenere la vista dalla cattedra o la vista studenti.

Il formato del file è:

```json
{
	"schemaVersion": 1,
	"className": "3A",
	"rows": 5,
	"cols": 4,
	"students": [
		{ "name": "Mario", "surname": "Rossi" }
	]
}
```

## Esempio di avvio locale

```bash
cd "/Volumes/Sandisk1/Scuola/disposizione dei banchi"
python3 -m http.server 8000
```

Poi apri http://localhost:8000

## Firebase Hosting

1. Crea un progetto nella console Firebase e copia il suo ID in `.firebaserc`, sostituendo `INSERISCI_QUI_ID_PROGETTO_FIREBASE`.
2. Installa Firebase CLI, se non è già presente:

```bash
npm install -g firebase-tools
```

3. Accedi e pubblica dalla cartella del progetto:

```bash
firebase login
firebase deploy --only hosting
```

La configurazione di Hosting è già presente in `firebase.json` e usa la cartella del progetto come directory pubblica.
