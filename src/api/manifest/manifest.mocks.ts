/** A check entry on the legacy (deprecating) manifest shape. */
interface LegacyMockCheck {
  name: string;
  label: string;
  description: string;
  type: string;
  src: string;
  status: string;
}

/** The legacy (deprecating) mock manifest entry shape. */
export interface LegacyMockManifest {
  id: string;
  package: string;
  version: string;
  hash: string;
  docs: { short: string; long: string; about: string };
  deps: { pups: { id: string; name: string; condition: string }[] };
  checks?: LegacyMockCheck[];
  gui?: { source: string };
  command: {
    path: string;
    args: string;
    cwd: string;
    env: null;
    config: { sections: { name: string; fields: Record<string, unknown>[] }[] };
    configFiles: null;
  };
}

export interface LegacyMockManifestSource {
  id?: string;
  label?: string;
  url?: string;
  lastUpdated?: string;
  available: LegacyMockManifest[];
}

export interface LegacyMockManifests {
  internal?: LegacyMockManifestSource;
  local: LegacyMockManifestSource;
}

export function generateManifests(input?: string[] | number): LegacyMockManifests {
  const randomChoice = <T,>(choices: T[]): T => choices[Math.floor(Math.random() * choices.length)];

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

  const generateRandomChecks = (pupName: string): LegacyMockCheck[] | undefined => {
    if (pupName !== 'Core') return;
    const checks = [
      {
        name: 'sync',
        label: 'Blockchain Sync',
        description: 'Syncing the blockchain',
        type: 'script',
        src: '/checks/sync.sh',
        status: 'loading'
      },
      {
        name: 'outbound',
        label: 'Outbound Connectivity',
        description: 'Can connect to other Nodes',
        type: 'script',
        src: '/checks/outbound.sh',
        status: 'loading'
      },{
        name: 'inbound',
        label: 'Inbound Connectivity',
        description: 'Can accept connections from other Nodes',
        type: 'script',
        src: '/checks/inbound.sh',
        status: 'loading'
      },
    ]
    return checks
  }

  const randomSemver = () => `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;

  const names = Array.isArray(input) ? input : Array.from({ length: input ?? 0 }, (_, index) => `Package_${index + 1}`);

  const produce = (array: string[]): LegacyMockManifest[] => array.map(name => ({
    id: name,
    package: name,
    version: randomSemver(),
    hash: Math.random().toString(36).substring(2, 15),
    docs: mockDocs[name] || mockDocs.lorem,
    deps: produceDepSegment(name),
    checks: generateRandomChecks(name),
    gui: produceGuiSegment(name),
    command: {
      path: `/path/to/${name}`,
      args: '',
      cwd: `/current/working/directory/${name}`,
      env: null,
      config: generateRandomConfig(),
      configFiles: null,
    },
  }));

  // 'Mock a hardcoded set'
  if (!input) {
    return {
      internal: {
        id: "internal",
        label: "Internal",
        url: "",
        lastUpdated: "2024-04-12T12:02:49.956991+10:00",
        available: produce(['Dogeboxd']),
      },
      local: {
        id: "local",
        label: "Local Filesystem",
        url: "",
        lastUpdated: "2024-04-12T12:02:49.956055+10:00",
        available: produce(['Core', 'Identity', 'GigaWallet', 'ShibeShop', 'Map', 'Tipjar'])
      }
    };
  }

  // Mock a dynamic set that considers the input.
  return {
    local: {
      available: produce(names),
    }
  };
}

const produceGuiSegment = (pupName: string): { source: string } | undefined => {
  switch (pupName) {
    case 'Map':
      return { source: 'http://map.pup.dogebox.local:9090' }
    case 'Identity':
      return { source: 'http://identity.pup.dogebox.local:7070' }
    case 'Tipjar':
      return { source: 'http://tipjar.pup.dogebox.local:6060' }
  }
}

const produceDepSegment = (pupName: string): LegacyMockManifest["deps"] => {
  switch (pupName) {
    case 'Core':
      return { pups: [] }
    case 'GigaWallet':
      return { pups: [
        { id: "Core", name: "Core", condition: ">=1.14.1" }
      ] }
    case 'ShibeShop':
      return { pups: [
        { id: "Core", name: "Core", condition: ">=1.14.1" },
        { id: "GigaWallet", name: "GigaWallet", condition: ">=1.0.0" }
      ] }
    default: 
      return { pups: [] }
  }
}

const mockDocs: Record<string, { short: string; long: string; about: string }> = {
  GigaWallet: {
    short: "The ultimate Dogecoin payment solution",
    long: "Anim qui in sunt in ea dolore voluptate cillum excepteur consectetur pariatur tempor adipisicing cupidatat dolor ullamco ullamco quis sed ullamco amet voluptate magna labore dolor elit nisi magna est ut qui nulla ex esse duis nostrud occaecat amet ea fugiat minim sint ad in sed laborum fugiat aliqua excepteur sit eiusmod do deserunt ut nisi enim dolor esse reprehenderit consectetur mollit irure do in aliquip esse aliqua reprehenderit deserunt excepteur enim dolor exercitation qui occaecat non culpa voluptate anim cupidatat commodo amet dolor reprehenderit velit reprehenderit officia ea exercitation labore cillum mollit irure nostrud pariatur cupidatat deserunt laborum esse incididunt fugiat reprehenderit consectetur adipisicing mollit non in labore sit eiusmod pariatur elit mollit velit cupidatat eu consectetur amet eiusmod cillum occaecat consectetur culpa dolore consequat sunt voluptate cillum magna nulla labore esse ut dolor laboris enim veniam sit excepteur deserunt duis cupidatat minim culpa aliqua dolor ad velit pariatur aliquip proident eu non proident enim voluptate officia commodo occaecat sit commodo voluptate consequat magna laboris et in elit veniam consequat excepteur sit qui officia ut deserunt et cillum exercitation enim elit consectetur non anim do aliquip nostrud incididunt veniam veniam sit veniam in aliqua laboris consectetur irure in veniam occaecat est consectetur nisi non est culpa dolor aliqua velit reprehenderit mollit exercitation in magna dolor irure.",
    about: `<h1>GigaWallet</h1>
      <h2>The Ultimate Dogecoin Payment Solution</h2>
      <p>Introducing GigaWallet, a powerful backend service that enables seamless integration of Dogecoin transactions into your application. With GigaWallet, online stores, exchanges, and social media platforms can easily incorporate Dogecoin payments, providing users with a convenient and secure payment option.</p>
      `
  },
  ShibeShop: {
    short: "Such shop, much Doge.",
    long: "List items for sale, manage inventory, and handle transactions seamlessly in Dogecoin.  ShibeShop is designed for individuals and small businesses to enter the digital marketplace with Dogecoin. It's user-friendly, ensuring that managing your sales, tracking inventory, and processing Dogecoin payments are straightforward and efficient. Ideal for Dogecoin enthusiasts and entrepreneurs eager to leverage cryptocurrency for e-commerce. Install ShibeShop to transform your digital sales experience.",
    about: `<h1>Such Package</h1>
      <h2>Much useful</h2>
      <p>In esse do tempor commodo cupidatat ullamco deserunt deserunt dolore ullamco consectetur et esse incididunt do ad veniam fugiat non pariatur nulla cillum laborum tempor excepteur. Laquis dolore et mollit est aliqua velit dolor id magna tempor sed ex irure eu officia proident sed aliqua nisi ut dolor excepteur adipisicing reprehenderit excepteur dolor laborum proident voluptate quis.</p>
      <p>Labore eiusmod anim do culpa non reprehenderit do sint anim proident aliqua do commodo dolore reprehenderit dolor fugiat elit irure enim mollit ut magna in tempor ex pariatur ullamco</p>`
  },
  lorem: {
    short: "Such package, much use.",
    long: "Anim qui in sunt in ea dolore voluptate cillum excepteur consectetur pariatur tempor adipisicing cupidatat dolor ullamco ullamco quis sed ullamco amet voluptate magna labore dolor elit nisi magna est ut qui nulla ex esse duis nostrud occaecat amet ea fugiat minim sint ad in sed laborum fugiat aliqua excepteur sit eiusmod do deserunt ut nisi enim dolor esse reprehenderit consectetur mollit irure do in aliquip esse aliqua reprehenderit deserunt excepteur enim dolor exercitation qui occaecat non culpa voluptate anim cupidatat commodo amet dolor reprehenderit velit reprehenderit officia ea exercitation labore cillum mollit irure nostrud pariatur cupidatat deserunt laborum esse incididunt fugiat reprehenderit consectetur adipisicing mollit non in labore sit eiusmod pariatur elit mollit velit cupidatat eu consectetur amet eiusmod cillum occaecat consectetur culpa dolore consequat sunt voluptate cillum magna nulla labore esse ut dolor laboris enim veniam sit excepteur deserunt duis cupidatat minim culpa aliqua dolor ad velit pariatur aliquip proident eu non proident enim voluptate officia commodo occaecat sit commodo voluptate consequat magna laboris et in elit veniam consequat excepteur sit qui officia ut deserunt et cillum exercitation enim elit consectetur non anim do aliquip nostrud incididunt veniam veniam sit veniam in aliqua laboris consectetur irure in veniam occaecat est consectetur nisi non est culpa dolor aliqua velit reprehenderit mollit exercitation in magna dolor irure.",
    about: `<h1>Such Package</h1>
      <h2>Much useful</h2>
      <p>In esse do tempor commodo cupidatat ullamco deserunt deserunt dolore ullamco consectetur et esse incididunt do ad veniam fugiat non pariatur nulla cillum laborum tempor excepteur. Laquis dolore et mollit est aliqua velit dolor id magna tempor sed ex irure eu officia proident sed aliqua nisi ut dolor excepteur adipisicing reprehenderit excepteur dolor laborum proident voluptate quis.</p>
      <p>Labore eiusmod anim do culpa non reprehenderit do sint anim proident aliqua do commodo dolore reprehenderit dolor fugiat elit irure enim mollit ut magna in tempor ex pariatur ullamco</p>`
  }
}