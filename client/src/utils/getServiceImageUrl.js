export const getServiceImageUrl = (serviceType, subType = null) => {
  const imageMap = {
    'brake-wire': {
      'standard': 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=400&fit=crop&q=80',
      'performance': 'https://images.unsplash.com/photo-1632823469770-0e8e6417a79a?w=800&h=400&fit=crop&q=80',
      'heavy-duty': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=400&fit=crop&q=80',
      'default': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=400&fit=crop&q=80'
    },
    'oil-change': {
      'conventional': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&h=400&fit=crop&q=80',
      'synthetic': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=400&fit=crop&q=80',
      'high-mileage': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop&q=80',
      'diesel': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop&q=80',
      'default': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&h=400&fit=crop&q=80'
    },
    'tire-rotation': 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&h=400&fit=crop&q=80',
    'engine-tune': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop&q=80',
    'transmission-service': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop&q=80'
  };

  if (typeof imageMap[serviceType] === 'object') {
    return imageMap[serviceType][subType] || imageMap[serviceType]['default'];
  }
  
  return imageMap[serviceType] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=400&fit=crop&q=80';
};