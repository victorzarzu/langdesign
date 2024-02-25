import "./css/design-area.css";

export interface HistoryDesignProps {
    name: string;
    onClick: () => void;
}

export const HistoryDesign: React.FC<HistoryDesignProps> = ({name, onClick}) => {    
    return (
        <span className='history-design' onClick={() => onClick()}>
            <span className='history-design-content'>
                <p>{name}</p> 
            </span>
        </span>
    );
};
