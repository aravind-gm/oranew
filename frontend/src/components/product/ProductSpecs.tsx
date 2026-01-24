
interface Specs {
  material?: string;
  weight?: string;
  dimensions?: string;
  careInstructions?: string;
}

interface ProductSpecsProps {
  specs: Specs;
}

export default function ProductSpecs({ specs }: ProductSpecsProps) {
  const specsData = [
    { label: 'Material', value: specs.material },
    { label: 'Weight', value: specs.weight },
    { label: 'Dimensions', value: specs.dimensions },
  ];

  const filteredSpecs = specsData.filter((spec) => spec.value);

  return (
    <div className="space-y-6">
      {/* Specifications */}
      {filteredSpecs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSpecs.map((spec, index) => (
              <div
                key={index}
                className="flex justify-between items-start p-3 border border-gray-200 rounded-lg"
              >
                <span className="text-gray-600 font-medium">{spec.label}:</span>
                <span className="text-gray-900">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Care Instructions */}
      {specs.careInstructions && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Care Instructions</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{specs.careInstructions}</p>
          </div>
        </div>
      )}
    </div>
  );
}
