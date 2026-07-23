export interface MockMetricDef {
  name: string;
  label: string;
  type: string;
  history?: number;
}

export interface MockConfigField {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface MockConfigSection {
  name: string;
  fields: MockConfigField[];
}

/** Loosely-shaped mock manifest produced for dev-mode bootstrap data. */
export interface MockManifest {
  config: { sections: MockConfigSection[] };
  container: unknown;
  dependencies: unknown[];
  manifestVersion: number;
  meta: { logoPath: string; name: string; version: string };
  permissionGroups: unknown[];
  metrics: MockMetricDef[];
}

export function generateManifestsV2(input?: string[] | number): MockManifest[] {
  const randomChoice = <T,>(choices: T[]): T => choices[Math.floor(Math.random() * choices.length)];
  const randomSemver = () => `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;

  const fieldLabels: Record<string, string> = {
    number: 'Number',
    text: 'Text',
    select: 'Select',
    toggle: 'Toggle',
    checkbox: 'Checkbox',
    radioButton: 'RadioButton',
    radio: 'Radio',
    range: 'Range',
    date: 'Date',
    // rating: 'Rating',
    color: 'Color',
    textarea: 'Textarea',
  };

  const generateRandomConfig = () => {
    const sectionNames = ['Identity', 'Connection'];
    const fields = Object.keys(fieldLabels);
    const options: Record<string, { label: string; value: string }[]> = {
      select: [
        { label: 'Blue', value: 'blue' },
        { label: 'Green', value: 'green' },
        { label: 'Purple', value: 'purple' },
      ],
      radio: [
        { label: 'Burger', value: 'burger' },
        { label: 'Nuggets', value: 'nuggets' },
        { label: 'Fries', value: 'fries' },
      ],
      radioButton: [
        { label: 'Orange', value: 'orange' },
        { label: 'Lemon', value: 'lemon' },
        { label: 'Lime', value: 'lime' },
      ]
    };

    // We have 12 field types.
    // We're going to generate a form that has 2 sections
    // with half the fields in the first section, half in the other.
    const halfFieldCount = Math.ceil(fields.length / 2);

    return {
      sections: sectionNames.map((sectionName, sectionIndex) => {
        const sliceStartIndex = sectionIndex * halfFieldCount;
        const sliceEndIndex = sliceStartIndex + halfFieldCount;
        return {
          name: sectionName,
          fields: fields.slice(sliceStartIndex, sliceEndIndex)
            .map((field, fieldIndex) => ({
            label: fieldLabels[field],
            name: `${field}_${sectionIndex}_${fieldIndex}`,
            type: field,
            ...(field === 'checkbox' || field === 'toggle' || field === 'rating' ? { required: false } : { required: randomChoice([true, true]) }),
            ...(field === 'select' || field === 'radio' || field === 'radioButton' ? { options: [...options[field]] } : {}),
            ...(field === 'range' ? { min: 1, max: 69, step: 1 } : {})
          }))
          }
      })
    };
  };

  const names = Array.isArray(input) ? input : Array.from({ length: input ?? 0 }, (_, index) => `Package_${index + 1}`);

  const coreMetrics: MockMetricDef[] = [
    {
      name: "chain",
      label: "Chain",
      type: "string",
      history: 1
    },
    {
      name: "blocks",
      label: "Block Height",
      type: "int",
      history: 30
    },
    {
      name: "headers",
      label: "Headers",
      type: "int",
      history: 30
    },
    {
      name: "difficulty",
      label: "Difficulty",
      type: "float",
      history: 30
    },
    {
      name: "verification_progress",
      label: "Verification progress",
      type: "string",
      history: 1
    },
    {
      name: "initial_block_download",
      label: "Initial Download",
      type: "string",
      history: 1
    },
    {
      name: "chain_size_human",
      label: "Blockchain Size",
      type: "string",
      history: 1
    }
  ];

  const produce = (array: string[]): MockManifest[] => array.map(name => {
    const isCoreVariant = name === 'Core' || name === 'Core green' || name === 'Sakura';
    
    return {
      config: generateRandomConfig(),
      container: {
        build: {
          nixFile: `${name.toLowerCase()}.nix`,
          nixFileSha256: "",
        },
        exposes: [
          {
            port: 80,
            trafficType: "http",
            type: "admin",
          },
          {
            port: 81,
            trafficType: "http",
            type: "admin",
          },
        ],
        services: [
          {
            command: {
              cwd: "/bin/",
              env: {},
              exec: `/bin/start-${name.toLowerCase()}1`,
            },
            name: `${name.toLowerCase()}1`,
          },
          {
            command: {
              cwd: "/bin/",
              env: {},
              exec: `/bin/start-${name.toLowerCase()}2`,
            },
            name: `${name.toLowerCase()}2`,
          },
        ],
      },
      dependencies: [],
      manifestVersion: 1,
      meta: {
        logoPath: "",
        name: name,
        version: randomSemver(),
      },
      permissionGroups: [],
      metrics: isCoreVariant ? coreMetrics : []
    };
  });

  // 'Mock a hardcoded set'
  if (!input) {
    return produce(['Core', 'Identity', 'GigaWallet', 'ShibeShop', 'Map', 'Tipjar'])
  };

  // Mock a dynamic set that considers the input.
  return produce(names)
}