import { useState } from 'react';
import { type CarEvaluation, CATEGORIES, type Category } from '../store/mockData';
import { BrandLogo } from '../components/BrandLogo';
import { Trophy, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface UserRankingProps {
    cars: CarEvaluation[];
}

export function UserRanking({ cars }: UserRankingProps) {
    const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');
    const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
    const [expandedCarId, setExpandedCarId] = useState<string | null>(null);

    const brands = Array.from(new Set(cars.map(c => c.brand))).sort();

    const filteredCars = cars.filter(c => {
        const matchCategory = selectedCategory === 'Todos' || c.category === selectedCategory;
        const matchBrand = selectedBrand === 'Todas' || c.brand === selectedBrand;
        return matchCategory && matchBrand;
    });

    const sortedCars = [...filteredCars].sort((a, b) => b.averageScore - a.averageScore);

    const toggleExpand = (id: string) => {
        setExpandedCarId(prev => prev === id ? null : id);
    };

    const getRankColor = (index: number) => {
        if (index === 0) return '#FFD700'; // Gold
        if (index === 1) return '#C0C0C0'; // Silver
        if (index === 2) return '#CD7F32'; // Bronze
        return 'var(--color-text)';
    };

    const aspectLabels: Record<string, string> = {
        acabamento: 'Acabamento',
        infotenimento: 'Infotenimento',
        espacoInterno: 'Espaço Interno',
        portaMalas: 'Porta-malas',
        desempenho: 'Desempenho',
        dirigibilidade: 'Dirigibilidade',
        conforto: 'Conforto',
        consumo: 'Consumo'
    };

    return (
        <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                    <Trophy style={{ color: 'var(--color-primary)' }} size={32} />
                    Ranking de Veículos
                </h1>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, marginRight: '0.5rem' }}>Categoria:</span>
                    <select
                        className="form-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as Category | 'Todos')}
                        style={{ padding: '0.5rem', minWidth: '150px' }}
                    >
                        <option value="Todos">Todas</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <span style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0.5rem 0 1rem' }}>Marca:</span>
                    <select
                        className="form-select"
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        style={{ padding: '0.5rem', minWidth: '150px' }}
                    >
                        <option value="Todas">Todas</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>
            {sortedCars.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
                    <Star size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                    <h3>Nenhum veículo avaliado nesta categoria.</h3>
                    <p>Mude para o modo Administrador para adicionar avaliações.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sortedCars.map((car, index) => (
                        <div key={car.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    backgroundColor: index === 0 ? 'rgba(255, 203, 8, 0.05)' : '#fff'
                                }}
                                onClick={() => toggleExpand(car.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 800,
                                        color: getRankColor(index),
                                        width: '30px',
                                        textAlign: 'center'
                                    }}>
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                            <BrandLogo brand={car.brand} size={30} />
                                            <span>
                                                {car.brand} {car.model} ({car.year})
                                            </span>
                                            {index === 0 && <Trophy size={20} color={getRankColor(0)} />}
                                        </h2>
                                        <span style={{
                                            display: 'inline-block',
                                            marginTop: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: '1px solid var(--color-border)'
                                        }}>
                                            {car.category}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Média Geral</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>
                                            {car.averageScore.toFixed(2)}
                                        </div>
                                    </div>
                                    <button className="btn" style={{ padding: '0.5rem' }}>
                                        {expandedCarId === car.id ? <ChevronUp /> : <ChevronDown />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {expandedCarId === car.id && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--color-surface)',
                                    borderTop: '1px solid var(--color-border)',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '2rem'
                                }}>
                                    <div style={{ flex: '1 1 500px' }}>
                                        <h4 style={{ marginBottom: '1rem', color: '#666' }}>Detalhamento das Notas</h4>
                                        <div className="grid grid-cols-2" style={{ gap: '1rem 2rem' }}>
                                            {Object.entries(car.aspects).map(([key, val]) => (
                                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <span style={{ fontWeight: 500 }}>{aspectLabels[key]}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${(val / 10) * 100}%`, backgroundColor: val >= 8 ? '#10b981' : val >= 6 ? 'var(--color-primary)' : 'var(--color-error)' }} />
                                                        </div>
                                                        <span style={{ fontWeight: 800, width: '30px', textAlign: 'right' }}>{val.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {car.carImage && (
                                        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                            <h4 style={{ marginBottom: '1rem', color: '#666', width: '100%', textAlign: 'center' }}>Imagem do Veículo</h4>
                                            <div style={{
                                                width: '100%',
                                                height: '200px',
                                                borderRadius: 'var(--radius-md)',
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                backgroundColor: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <img
                                                    src={car.carImage}
                                                    alt={`Foto de ${car.brand} ${car.model}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = `https://via.placeholder.com/600x400/e5e7eb/374151?text=${encodeURIComponent(car.brand + ' ' + car.model)}`;
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
