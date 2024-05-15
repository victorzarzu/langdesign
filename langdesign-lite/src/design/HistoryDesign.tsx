import "./css/design-area.css";

export interface HistoryDesignProps {
    name: string;
    onClick: () => void;
}

export const HistoryDesign: React.FC<HistoryDesignProps> = ({name, onClick}) => {    
    return (
        <div className='history-design' onClick={() => onClick()} >
            <div className='history-design-content'>
                <p>{name}</p> 
            </div>
        </div>
    );
};
