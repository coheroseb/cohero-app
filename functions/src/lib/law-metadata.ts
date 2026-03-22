/**
 * Metadata for Danish Social and Administrative Laws
 * Used to improve AI relevance detection in semantic search.
 */

export interface LawMetadata {
    id: string;
    description: string;
    keywords: string[];
}

export const LAW_METADATA: Record<string, LawMetadata> = {
    "barnets-lov": {
        id: "barnets-lov",
        description: "Gælder støtte til børn og unge under 18 år. Erstatter mange af de tidligere børnebestemmelser i serviceloven.",
        keywords: ["underretningspligt", "underretning", "anbringelse", "støtte til børn", "plejefamilie", "børnefaglig undersøgelse", "§ 50", "efterværn", "samvær"]
    },
    "serviceloven": {
        id: "serviceloven",
        description: "Rammelov for social service til voksne, ældre og personer med handicap. Dækker også visse emner for børn indtil 2024.",
        keywords: ["merudgifter", "hjælpemidler", "botilbud", "ledsageordning", "hjemmehjælp", "socialpædagogisk bistand", "§ 85", "§ 107", "voksne"]
    },
    "forvaltningsloven": {
        id: "forvaltningsloven",
        description: "Generelle regler for behandling af sager i den offentlige forvaltning. Sikrer borgernes retssikkerhed i processen.",
        keywords: ["partshøring", "aktindsigt", "tavshedspligt", "begrundelse", "vejledningspligt", "habilitet", "klagevejledning"]
    },
    "retssikkerhedsloven": {
        id: "retssikkerhedsloven",
        description: "Regler om hvordan sociale sager skal behandles og borgernes rettigheder i socialsystemet.",
        keywords: ["sagsoplysning", "officialprincippet", "hurtighedsprincippet", "helhedsvurdering", "frister", "borgerinddragelse"]
    },
    "sundhedsloven": {
        id: "sundhedsloven",
        description: "Regler for det danske sundhedsvæsen, patienters rettigheder og behandling.",
        keywords: ["patientrettigheder", "samtykke til behandling", "journalindsigt", "tavshedspligt i sundhedsvæsenet", "genoptræning"]
    },
    "offentlighedsloven": {
        id: "offentlighedsloven",
        description: "Regler om aktindsigt for andre end parterne i en sag (f.eks. pressen eller naboer).",
        keywords: ["meroffentlighed", "aktindsigt", "notatpligt", "eksterne dokumenter", "forvaltningskultur"]
    }
};
