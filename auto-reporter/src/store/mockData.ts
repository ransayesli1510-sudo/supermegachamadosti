export type Category = 'Hatches' | 'Sedans' | 'SUV' | 'Pick-ups' | 'Híbridos' | 'Elétricos';

export interface EvaluationAspects {
    acabamento: number;
    infotenimento: number;
    espacoInterno: number;
    portaMalas: number;
    desempenho: number;
    dirigibilidade: number;
    conforto: number;
    consumo: number;
}

export interface CarEvaluation {
    id: string;
    brand: string;
    brandLogo?: string;
    model: string;
    carImage?: string;
    year: number;
    category: Category;
    aspects: EvaluationAspects;
    averageScore: number;
}

export const CATEGORIES: Category[] = [
    'Hatches', 'Sedans', 'SUV', 'Pick-ups', 'Híbridos', 'Elétricos'
];

export const BRAND_LOGOS: Record<string, string> = {
    'Toyota': 'https://logo.clearbit.com/toyota.com',
    'Honda': 'https://logo.clearbit.com/honda.com',
    'Volkswagen': 'https://logo.clearbit.com/vw.com',
    'BYD': 'https://logo.clearbit.com/byd.com',
    'Chevrolet': 'https://logo.clearbit.com/chevrolet.com',
    'Fiat': 'https://logo.clearbit.com/fiat.com',
    'Jeep': 'https://logo.clearbit.com/jeep.com',
    'Hyundai': 'https://logo.clearbit.com/hyundai.com',
    'Ford': 'https://logo.clearbit.com/ford.com',
    'Nissan': 'https://logo.clearbit.com/nissan.com',
    'Renault': 'https://logo.clearbit.com/renault.com'
};

export const calculateAverage = (aspects: EvaluationAspects): number => {
    const sum = Object.values(aspects).reduce((a, b) => a + b, 0);
    return Number((sum / 8).toFixed(2));
};

export const MOCK_CARS: CarEvaluation[] = [
    {
        id: '1',
        brand: 'Toyota',
        model: 'Corolla',
        carImage: 'https://placehold.co/600x400/eeeeee/333333?text=Toyota+Corolla',
        year: 2024,
        category: 'Sedans',
        aspects: {
            acabamento: 8,
            infotenimento: 7,
            espacoInterno: 8,
            portaMalas: 8,
            desempenho: 7,
            dirigibilidade: 8,
            conforto: 9,
            consumo: 8,
        },
        averageScore: calculateAverage({ acabamento: 8, infotenimento: 7, espacoInterno: 8, portaMalas: 8, desempenho: 7, dirigibilidade: 8, conforto: 9, consumo: 8 })
    },
    {
        id: '2',
        brand: 'Honda',
        model: 'Civic',
        carImage: 'https://placehold.co/600x400/eeeeee/333333?text=Honda+Civic',
        year: 2024,
        category: 'Sedans',
        aspects: {
            acabamento: 9,
            infotenimento: 8,
            espacoInterno: 8,
            portaMalas: 7,
            desempenho: 8,
            dirigibilidade: 9,
            conforto: 8,
            consumo: 8,
        },
        averageScore: calculateAverage({ acabamento: 9, infotenimento: 8, espacoInterno: 8, portaMalas: 7, desempenho: 8, dirigibilidade: 9, conforto: 8, consumo: 8 })
    },
    {
        id: '3',
        brand: 'Volkswagen',
        model: 'Polo',
        carImage: 'https://placehold.co/600x400/eeeeee/333333?text=VW+Polo',
        year: 2023,
        category: 'Hatches',
        aspects: {
            acabamento: 7,
            infotenimento: 8,
            espacoInterno: 7,
            portaMalas: 6,
            desempenho: 8,
            dirigibilidade: 8,
            conforto: 7,
            consumo: 8,
        },
        averageScore: calculateAverage({ acabamento: 7, infotenimento: 8, espacoInterno: 7, portaMalas: 6, desempenho: 8, dirigibilidade: 8, conforto: 7, consumo: 8 })
    },
    {
        id: '4',
        brand: 'BYD',
        model: 'Dolphin',
        carImage: 'https://placehold.co/600x400/eeeeee/333333?text=BYD+Dolphin',
        year: 2024,
        category: 'Elétricos',
        aspects: {
            acabamento: 8,
            infotenimento: 9,
            espacoInterno: 8,
            portaMalas: 6,
            desempenho: 8,
            dirigibilidade: 7,
            conforto: 8,
            consumo: 10,
        },
        averageScore: calculateAverage({ acabamento: 8, infotenimento: 9, espacoInterno: 8, portaMalas: 6, desempenho: 8, dirigibilidade: 7, conforto: 8, consumo: 10 })
    }
];
