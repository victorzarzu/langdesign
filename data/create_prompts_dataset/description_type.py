from enum import Enum

class DescriptionType(Enum):
    ANY_TYPE = 0
    CHAIR = 1
    BED = 2
    WINDOW_THINGS = 3
    TABLE = 4
    BEDROOM = 5
    KITCHEN = 6
    LIVING_ROOM = 7
    BATHROOM = 8

def get_description_type(description):
    if 'bedroom' in description:
        return """generate a bedroom json for interior design editing""" 
    if 'kitchen' in description:
        return """generate a kitchen json for interior design editing""" 
    if 'living room' in description:
        return """generate a living room json for interior design editing""" 
    if 'bathroom' in description:
        return """generate a bathroom json for interior design editing""" 
    if 'chair' in description:
        return """generate a chair json for interior design editing""" 
    if 'bed' in description:
        return """generate a bed json for interior design editing""" 
    if 'table' in description or 'desk' in description:
        return """generate a table json for interior design editing""" 
    if 'curtain' in description or 'blinds' in description or 'shades' in description:
        return """generate a curtain json for interior design editing""" 
    
    return """generate a random json for interior design editing""" 