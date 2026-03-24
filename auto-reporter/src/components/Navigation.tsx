import { Settings, Users, CarFront } from 'lucide-react';

interface NavigationProps {
    isAdminMode: boolean;
    toggleMode: () => void;
}

export function Navigation({ isAdminMode, toggleMode }: NavigationProps) {
    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <div className="navbar-brand">
                    <CarFront size={32} />
                    Auto Repórter
                </div>

                <button
                    onClick={toggleMode}
                    className={`btn ${isAdminMode ? 'btn-secondary' : 'btn-outline'}`}
                >
                    {isAdminMode ? (
                        <>
                            <Users size={20} />
                            Modo Usuário
                        </>
                    ) : (
                        <>
                            <Settings size={20} />
                            Modo Administrador
                        </>
                    )}
                </button>
            </div>
        </nav>
    );
}
