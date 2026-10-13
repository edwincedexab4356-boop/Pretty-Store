export interface ProvinceOption {
  id: string;
  name: string;
  tag: string;
}

export interface ServientregaBranch {
  branch: string;
  branchRate: string;
  homeRate: string;
}

export interface BranchOption {
  branch: string;
  rate: string;
}

export const PROVINCIAS: ProvinceOption[] = [{id:`Panamá Capital`,name:`Panamá Capital`,tag:`Ciudad de Panamá · Chepo`},{id:`Panamá Oeste`,name:`Panamá Oeste`,tag:`La Chorrera · Arraiján`},{id:`Colón`,name:`Colón`,tag:`Costa Atlántica`},{id:`Coclé`,name:`Coclé`,tag:`Penonomé · Aguadulce`},{id:`Herrera`,name:`Herrera`,tag:`Chitré · Pesé`},{id:`Los Santos`,name:`Los Santos`,tag:`Las Tablas · Pedasí`},{id:`Veraguas`,name:`Veraguas`,tag:`Santiago · Soná`},{id:`Chiriquí`,name:`Chiriquí`,tag:`David · Boquete · Bugaba`},{id:`Bocas del Toro`,name:`Bocas del Toro`,tag:`Changuinola · Isla Colón`},{id:`Darién`,name:`Darién`,tag:`Metetí`},{id:`Comarcas`,name:`Comarcas`,tag:`Guna Yala · Ngäbe-Buglé`}];

export const SERVIENTREGA_RATES: Record<string, ServientregaBranch[]> = {
  "Panamá Capital": [
    { branch: `Dirección General - Parque Lefevre`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Vía España - Plaza Concordia`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `El Dorado (Plaza Golden)`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Paitilla`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Las Mañanitas`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Los Andes Mall`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV TSB Cargo San Francisco`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Perugraff - Tortí`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Mr. Mail - El Dorado`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Cargo Box Express Hato Pintado`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Mr. Mail Vía Argentina`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Chepo (AV Compucel)`, branchRate: `$8.00`, homeRate: `$8.00` },
    { branch: `AV Shop Box DB Don Bosco`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Ebuy Panamá`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Costa del Este Tu Carga Express`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Vía Israel Tu Carga Express`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Box to Box Los Ángeles`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Box to Box Versalles`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Box to Box Marbella`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Box to Box Villa Zaita`, branchRate: `$3.86`, homeRate: `$5.79` }
  ],
  "Panamá Oeste": [
    { branch: `La Chorrera (Av. de las Américas)`, branchRate: `$3.25`, homeRate: `$5.61` },
    { branch: `AV Box to Box Costa Verde`, branchRate: `$3.25`, homeRate: `$5.61` },
    { branch: `AV Paquetexpress PTY Coronado`, branchRate: `$3.25`, homeRate: `$4.61` },
    { branch: `AV Ptybuy Express Arraiján`, branchRate: `$3.25`, homeRate: `$4.61` }
  ],
  Chiriquí: [
    { branch: `David El Rocío / David Calle 4ta`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Concepción Bugaba Shop Express`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Barú Servicios y Utilería`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Puerto Armuelles - Rapid Services Barú`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Río Sereno - Farmacia Don Andrés`, branchRate: `$6.00`, homeRate: `$10.60` },
    { branch: `AV Volcán - Alfa Cell Technologic`, branchRate: `$6.00`, homeRate: `$10.60` },
    { branch: `AV Chiriquí - Tolé Monchis Compras`, branchRate: `$6.00`, homeRate: `$10.60` },
    { branch: `AV E-Box Express Paso Canoas`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Box to Box Doleguita`, branchRate: `$3.86`, homeRate: `$5.79` }
  ],
  Coclé: [
    { branch: `AV El Valle de Antón - El Valle Express`, branchRate: `$3.25`, homeRate: `$4.61` },
    { branch: `Penonomé`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Aguadulce`, branchRate: `$3.86`, homeRate: `$5.79` }
  ],
  Herrera: [
    { branch: `Chitré (Av. Herrera)`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Chitré (Plaza Azuero)`, branchRate: `$3.86`, homeRate: `$5.79` }
  ],
  "Los Santos": [
    { branch: `AV Guararé - Malala`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `AV Tonosí - Hostal Victoria Malala`, branchRate: `$3.86`, homeRate: `$5.79` },
    { branch: `Las Tablas`, branchRate: `$3.86`, homeRate: `$5.79` }
  ],
  Veraguas: [
    { branch: `Santiago (Plaza Tío Fabio)`, branchRate: `$3.86`, homeRate: `$5.79` }
  ],
  Colón: [
    { branch: `Colón (Calle 11 frente al estadio Mariano Bula)`, branchRate: `$3.86`, homeRate: `$5.79` }
  ],
  "Bocas del Toro": [
    { branch: `Changuinola (Av. Omar Torrijos Herrera)`, branchRate: `$11.35`, homeRate: `$15.95` },
    { branch: `AV Bocas Island Express (Isla Colón)`, branchRate: `$11.35`, homeRate: `$15.95` },
    { branch: `AV Chiriquí Grande - Multiservicios Zamarci`, branchRate: `$11.35`, homeRate: `$15.95` },
    { branch: `AV Almirante Soluciones y Más`, branchRate: `$11.35`, homeRate: `$15.95` }
  ],
  Darién: [
    { branch: `AV Metetí Darién - Valeria's Boutique`, branchRate: `$6.00`, homeRate: `$10.60` }
  ],
  Comarcas: [
    { branch: `Agencia Principal / Más cercana`, branchRate: `$6.00`, homeRate: `$10.60` }
  ]
};

export const FERGUSON_RATES: Record<string, BranchOption[]> = {
  "Panamá Capital": [
    { branch: `Vista Hermosa`, rate: `$5.00` },
    { branch: `San Pedro`, rate: `$5.00` },
    { branch: `24 de Diciembre`, rate: `$5.00` },
    { branch: `Justo Arosemena`, rate: `$5.00` },
    { branch: `Calle 50`, rate: `$5.00` },
    { branch: `Chepo`, rate: `$8.50` }
  ],
  "Panamá Oeste": [
    { branch: `La Chorrera (Parque Feuillet)`, rate: `$5.00` },
    { branch: `Vista Alegre`, rate: `$5.00` },
    { branch: `Arraiján Cabecera`, rate: `$5.00` }
  ],
  Chiriquí: [
    { branch: `David – Edificio Garrido`, rate: `$5.00` },
    { branch: `David – Plaza Salamanca`, rate: `$5.00` },
    { branch: `Puerto Armuelles`, rate: `$6.00` },
    { branch: `Concepción – Bugaba`, rate: `$6.00` },
    { branch: `Volcán`, rate: `$6.00` },
    { branch: `Boquete`, rate: `$6.00` }
  ],
  Coclé: [
    { branch: `Penonomé (Central)`, rate: `$5.00` },
    { branch: `Aguadulce`, rate: `$5.00` }
  ],
  Herrera: [
    { branch: `Chitré (C. Amita Burgos de Amado)`, rate: `$5.00` }
  ],
  "Los Santos": [
    { branch: `Las Tablas (Montana Mall)`, rate: `$6.00` }
  ],
  Veraguas: [
    { branch: `Santiago (Terminal)`, rate: `$5.00` },
    { branch: `Soná`, rate: `$5.00` }
  ],
  Colón: [
    { branch: `Colón Centro`, rate: `$5.50` },
    { branch: `Colón – Sabanitas`, rate: `$5.50` }
  ],
  "Bocas del Toro": [
    { branch: `Changuinola`, rate: `$8.50` }
  ],
  Darién: [
    { branch: `Darién – Metetí`, rate: `$8.50` }
  ],
  Comarcas: [
    { branch: `Agencia Principal / Más cercana`, rate: `$8.50` }
  ]
};

export const UNOEXPRESS_RATES: Record<string, BranchOption[]> = {"Panamá Capital":[{branch:`Marbella`,rate:`$6.50`},{branch:`Tumba Muerto`,rate:`$6.50`},{branch:`Albrook`,rate:`$6.50`},{branch:`Costa del Este`,rate:`$6.50`},{branch:`Obarrio`,rate:`$6.50`},{branch:`Plaza Tocumen`,rate:`$6.50`},{branch:`Vía Brasil`,rate:`$6.50`},{branch:`San Francisco`,rate:`$6.50`},{branch:`Justo Arosemena`,rate:`$6.50`},{branch:`Vista Hermosa`,rate:`$6.50`},{branch:`24 de Diciembre`,rate:`$6.50`},{branch:`Río Abajo`,rate:`$6.50`},{branch:`Juan Díaz`,rate:`$6.50`},{branch:`Villa Lucre`,rate:`$6.50`},{branch:`Brisas del Golf`,rate:`$6.50`},{branch:`Los Andes`,rate:`$6.50`},{branch:`Villa Zaita`,rate:`$6.50`},{branch:`El Dorado`,rate:`$6.50`},{branch:`Chepo`,rate:`$8.00`}],"Panamá Oeste":[{branch:`Gorgona`,rate:`$6.50`},{branch:`Paseo Arraiján`,rate:`$6.50`},{branch:`Vista Alegre`,rate:`$6.50`},{branch:`La Chorrera (Plaza Italia)`,rate:`$6.50`},{branch:`Westland Mall`,rate:`$6.50`}],Coclé:[{branch:`El Valle de Antón`,rate:`$7.50`},{branch:`Penonomé (Plaza Boulevard)`,rate:`$6.50`},{branch:`Aguadulce (Centro)`,rate:`$6.50`}],Veraguas:[{branch:`Santiago (Plaza Boulevard)`,rate:`$6.50`},{branch:`Soná`,rate:`$6.50`}],Herrera:[{branch:`Chitré (Plaza Moderna)`,rate:`$6.50`},{branch:`Chitré (Terminal)`,rate:`$6.50`}],"Los Santos":[{branch:`Las Tablas (Centro)`,rate:`$6.50`},{branch:`Pedasí`,rate:`$7.50`}],Chiriquí:[{branch:`David Obaldía`,rate:`$6.50`},{branch:`David San Mateo`,rate:`$6.50`},{branch:`David Terronal`,rate:`$6.50`},{branch:`Bugaba`,rate:`$6.50`},{branch:`Volcán`,rate:`$7.50`},{branch:`Frontera`,rate:`$6.50`},{branch:`Pto Armuelles`,rate:`$7.50`},{branch:`Boquete`,rate:`$6.50`}],Colón:[{branch:`Colón 4 altos`,rate:`$6.50`}],"Bocas del Toro":[{branch:`Changuinola (Centro)`,rate:`$10.50`},{branch:`Chiriquí Grande`,rate:`$10.50`},{branch:`Almirante`,rate:`$10.50`},{branch:`Isla Colón`,rate:`$10.50`}],Darién:[{branch:`Metetí`,rate:`$9.50`}],Comarcas:[{branch:`Agencia Principal / Más cercana`,rate:`$9.50`}]};

export function parseShippingRate(rateStr?: string | null): number {
  if (!rateStr) return 0;
  const match = rateStr.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? 0 : val;
  }
  return 0;
}
