import { useState } from 'react';
import { type Category, type CarEvaluation, CATEGORIES, calculateAverage, type EvaluationAspects, BRAND_LOGOS } from '../store/mockData';
import { BrandLogo } from '../components/BrandLogo';
import { Save, AlertCircle, Edit2, Trash2, X } from 'lucide-react';

interface AdminDashboardProps {
    cars: CarEvaluation[];
    onAddCar: (car: CarEvaluation) => void;
    onUpdateCar: (car: CarEvaluation) => void;
    onDeleteCar: (id: string) => void;
}

const INITIAL_ASPECTS: EvaluationAspects = {
    acabamento: 5,
    infotenimento: 5,
    espacoInterno: 5,
    portaMalas: 5,
    desempenho: 5,
    dirigibilidade: 5,
    conforto: 5,
    consumo: 5
};

export function AdminDashboard({ cars, onAddCar, onUpdateCar, onDeleteCar }: AdminDashboardProps) {
    const [editingCarId, setEditingCarId] = useState<string | null>(null);
    const [brand, setBrand] = useState('');
    const [brandLogo, setBrandLogo] = useState('');
    const [modelName, setModelName] = useState('');
    const [carImage, setCarImage] = useState('');
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [category, setCategory] = useState<Category>('Hatches');
    const [aspects, setAspects] = useState<EvaluationAspects>(INITIAL_ASPECTS);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentAverage = calculateAverage(aspects);

    const handleAspectChange = (aspect: keyof EvaluationAspects, value: number) => {
        setAspects(prev => ({ ...prev, [aspect]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modelName.trim() || !brand.trim()) return;

        const carData: CarEvaluation = {
            id: editingCarId || Date.now().toString(),
            brand: brand.trim(),
            brandLogo: brandLogo.trim() || undefined,
            model: modelName.trim(),
            carImage: carImage.trim() || undefined,
            year,
            category,
            aspects,
            averageScore: currentAverage
        };

        if (editingCarId) {
            onUpdateCar(carData);
        } else {
            onAddCar(carData);
        }

        resetForm();

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const resetForm = () => {
        setEditingCarId(null);
        setBrand('');
        setBrandLogo('');
        setModelName('');
        setCarImage('');
        setYear(new Date().getFullYear());
        setCategory('Hatches');
        setAspects(INITIAL_ASPECTS);
    };

    const handleEdit = (car: CarEvaluation) => {
        setEditingCarId(car.id);
        setBrand(car.brand);
        setBrandLogo(car.brandLogo || '');
        setModelName(car.model);
        setCarImage(car.carImage || '');
        setYear(car.year);
        setCategory(car.category);
        setAspects({ ...car.aspects });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const aspectLabels: Record<keyof EvaluationAspects, string> = {
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
        <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle style={{ color: 'var(--color-primary)' }} />
                        <h2>{editingCarId ? 'Editar Veículo' : 'Avaliar Novo Automóvel'}</h2>
                    </div>
                    {editingCarId && (
                        <button type="button" onClick={resetForm} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <X size={16} /> Cancelar Edição
                        </button>
                    )}
                </div>

                {showSuccess && (
                    <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #10b981' }}>
                        Automóvel avaliado e salvo com sucesso!
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="brand">Marca</label>
                            <input
                                id="brand"
                                className="form-input"
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="Ex: Honda"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="modelName">Modelo do Automóvel</label>
                            <input
                                id="modelName"
                                className="form-input"
                                type="text"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                placeholder="Ex: Civic"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Logotipo da Marca</label>
                            {/* Preview */}
                            {brandLogo && (
                                <div style={{ marginBottom: '0.5rem', width: '60px', height: '60px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8' }}>
                                    <img src={brandLogo} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            )}
                            <label htmlFor="brandLogoFile" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', backgroundColor: 'var(--color-surface)',
                                border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem',
                                width: '100%', boxSizing: 'border-box'
                            }}>
                                📂 Selecionar arquivo (.jpg/.png)
                            </label>
                            <input
                                id="brandLogoFile"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => setBrandLogo(reader.result as string);
                                    reader.readAsDataURL(file);
                                }}
                            />
                            <input
                                id="brandLogo"
                                className="form-input"
                                type="url"
                                value={brandLogo.startsWith('data:') ? '' : brandLogo}
                                onChange={(e) => setBrandLogo(e.target.value)}
                                placeholder={BRAND_LOGOS[brand] ? "Padrão do sistema ou cole URL" : "Ou cole URL da imagem"}
                                style={{ fontSize: '0.8rem' }}
                            />
                            {BRAND_LOGOS[brand] && !brandLogo && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>Logo padrão será usado automaticamente</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Imagem do Veículo</label>
                            {/* Preview */}
                            {carImage && (
                                <div style={{ marginBottom: '0.5rem', width: '100%', height: '80px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#f8f8f8' }}>
                                    <img src={carImage} alt="Car preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <label htmlFor="carImageFile" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', backgroundColor: 'var(--color-surface)',
                                border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem',
                                width: '100%', boxSizing: 'border-box'
                            }}>
                                📂 Selecionar arquivo (.jpg/.png)
                            </label>
                            <input
                                id="carImageFile"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => setCarImage(reader.result as string);
                                    reader.readAsDataURL(file);
                                }}
                            />
                            <input
                                id="carImage"
                                className="form-input"
                                type="url"
                                value={carImage.startsWith('data:') ? '' : carImage}
                                onChange={(e) => setCarImage(e.target.value)}
                                placeholder="Ou cole URL da imagem"
                                style={{ fontSize: '0.8rem' }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="year">Ano</label>
                            <input
                                id="year"
                                className="form-input"
                                type="number"
                                min="1900"
                                max={new Date().getFullYear() + 2}
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="category">Categoria</label>
                            <select
                                id="category"
                                className="form-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as Category)}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr style={{ margin: '2rem 0', borderColor: 'var(--color-border)', opacity: 0.5 }} />

                    <h3 style={{ marginBottom: '1.5rem' }}>Critérios de Avaliação (0 - 10)</h3>

                    <div className="grid grid-cols-2" style={{ gap: '1.5rem 2rem' }}>
                        {(Object.keys(aspects) as Array<keyof EvaluationAspects>).map((key) => (
                            <div key={key} className="form-group">
                                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">{aspectLabels[key]}</label>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-primary)', textShadow: '1px 1px 0 #000' }}>
                                        {aspects[key].toFixed(1)}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={aspects[key]}
                                    onChange={(e) => handleAspectChange(key, parseFloat(e.target.value))}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: '2.5rem',
                        padding: '1.5rem',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-primary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#666' }}>Nota Geral Calculada</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>
                                {currentAverage.toFixed(2)}
                            </p>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            <Save size={20} />
                            {editingCarId ? 'Atualizar Veículo' : 'Salvar Avaliação'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Veículos Cadastrados</h3>
                {cars.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>Nenhum veículo cadastrado ainda.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {cars.map(car => (
                            <div key={car.id} style={{
                                padding: '1rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: editingCarId === car.id ? 'rgba(255, 203, 8, 0.1)' : 'transparent'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <BrandLogo brand={car.brand} size={28} />
                                    <span style={{ fontWeight: 600 }}>{car.brand} {car.model}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>({car.year} - {car.category})</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(car)}
                                        className="btn"
                                        style={{ padding: '0.5rem', backgroundColor: '#e2e8f0', color: '#334155' }}
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm(`Tem certeza que deseja excluir ${car.brand} ${car.model}?`)) {
                                                onDeleteCar(car.id);
                                                if (editingCarId === car.id) resetForm();
                                            }
                                        }}
                                        className="btn"
                                        style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#ef4444' }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
