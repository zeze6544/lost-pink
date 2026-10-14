/* Transcribed from the Jaws CloudWaitress order page on 14 Oct 2026.
   Hidden items are omitted. Option prices are the amounts stored on each
   option; the public list shows the base price until an item is opened. */
export type JawsOption = { name: string; price: string | null };
export type JawsOptionGroup = { label: string; options: JawsOption[] };
export type JawsItem = {
  name: string;
  price: string;
  description?: string;
  subtitle?: string;
  outOfStock?: boolean;
  options?: JawsOptionGroup[];
};
export type JawsCategory = {
  name: string;
  description?: string;
  items: JawsItem[];
};
export type JawsMenu = {
  name: string;
  note: string;
  hours: { day: string; open: string; close: string }[];
  categories: JawsCategory[];
};

export const jawsMenus: JawsMenu[] = [
  {
    "name": "MENU",
    "note": "A 2% service fee applies to all orders.",
    "hours": [],
    "categories": [
      {
        "name": "SNACKS",
        "items": [
          {
            "name": "Potato Cakes",
            "price": "$1.70"
          },
          {
            "name": "Dim Sim",
            "price": "$1.70"
          },
          {
            "name": "Steam Dim Sim",
            "price": "$1.70",
            "options": [
              {
                "label": "Dim Sim Mods",
                "options": [
                  {
                    "name": "No Soy Sauce",
                    "price": null
                  },
                  {
                    "name": "Extra Soy Sauce",
                    "price": null
                  }
                ]
              }
            ]
          },
          {
            "name": "South Melbourne Dim Sim",
            "price": "$3.50",
            "description": "Fried Only"
          },
          {
            "name": "Potato Gems",
            "price": "$5.50"
          },
          {
            "name": "Dino Nugget",
            "price": "$1.00",
            "options": [
              {
                "label": "Quantity",
                "options": [
                  {
                    "name": "1 Pc",
                    "price": null
                  },
                  {
                    "name": "6 Pcs",
                    "price": "$3.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Vegetable Spring Rolls",
            "price": "$1.70"
          },
          {
            "name": "Spring Rolls",
            "price": "$3.50"
          },
          {
            "name": "Chiko Rolls",
            "price": "$3.50"
          },
          {
            "name": "Corn Jack",
            "price": "$3.50"
          },
          {
            "name": "Sausage in Batter",
            "price": "$3.50"
          },
          {
            "name": "Cheese Kransky",
            "price": "$4.80"
          },
          {
            "name": "Hamburger in Batter",
            "price": "$4.80"
          },
          {
            "name": "Chicken Schnitzel",
            "price": "$8.00"
          },
          {
            "name": "Beef Croquette",
            "price": "$3.00"
          },
          {
            "name": "Chicken Croquette",
            "price": "$3.00"
          },
          {
            "name": "Chicken Garlic Ball",
            "price": "$2.80"
          },
          {
            "name": "Chicken Strip",
            "price": "$2.20"
          },
          {
            "name": "Onion Rings",
            "price": "$3.00"
          }
        ]
      },
      {
        "name": "CHIPS",
        "items": [
          {
            "name": "Minimum Chips",
            "price": "$5.50",
            "options": [
              {
                "label": "Options",
                "options": [
                  {
                    "name": "No Salt",
                    "price": null
                  },
                  {
                    "name": "Add Salt",
                    "price": null
                  },
                  {
                    "name": "Chicken Salt",
                    "price": null
                  }
                ]
              }
            ]
          },
          {
            "name": "Medium Chips",
            "price": "$8.00",
            "options": [
              {
                "label": "Options",
                "options": [
                  {
                    "name": "No Salt",
                    "price": null
                  },
                  {
                    "name": "Add Salt",
                    "price": null
                  },
                  {
                    "name": "Chicken Salt",
                    "price": null
                  }
                ]
              }
            ]
          },
          {
            "name": "Large Chips",
            "price": "$11.00",
            "options": [
              {
                "label": "Options",
                "options": [
                  {
                    "name": "No Salt",
                    "price": null
                  },
                  {
                    "name": "Add Salt",
                    "price": null
                  },
                  {
                    "name": "Chicken Salt",
                    "price": null
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "DESSERTS",
        "items": [
          {
            "name": "Pineapple Fritter",
            "price": "$2.50"
          },
          {
            "name": "Banana Fritter",
            "price": "$2.50"
          },
          {
            "name": "Mars Bar in Batter",
            "price": "$3.50"
          }
        ]
      },
      {
        "name": "SALAD",
        "items": [
          {
            "name": "Garden Salad",
            "price": "$6.00",
            "outOfStock": true
          },
          {
            "name": "Greek Salad",
            "price": "$6.00",
            "outOfStock": true
          },
          {
            "name": "Coleslaw Salad",
            "price": "$6.00",
            "outOfStock": true
          }
        ]
      },
      {
        "name": "FRIED FISH",
        "items": [
          {
            "name": "Fried Flake (Local Gummy)",
            "price": "$9.80"
          },
          {
            "name": "Fried Whiting",
            "price": "$9.80"
          },
          {
            "name": "Fried Blue Grenadier",
            "price": "$9.80"
          },
          {
            "name": "Fried Snapper",
            "price": "$9.80"
          },
          {
            "name": "Fried Barramundi",
            "price": "$9.80"
          },
          {
            "name": "Fried Sea Perch",
            "price": "$11.80"
          }
        ]
      },
      {
        "name": "GRILLED FISH",
        "items": [
          {
            "name": "Grilled Flake (Local Gummy)",
            "price": "$10.60"
          },
          {
            "name": "Grilled Whiting",
            "price": "$10.60"
          },
          {
            "name": "Grilled Blue Grenadier",
            "price": "$10.60"
          },
          {
            "name": "Grilled Snapper",
            "price": "$10.60"
          },
          {
            "name": "Grilled Barramundi",
            "price": "$10.60"
          },
          {
            "name": "Grilled Sea Perch",
            "price": "$12.60"
          }
        ]
      },
      {
        "name": "SEAFOOD",
        "items": [
          {
            "name": "Fish Bite",
            "price": "$2.00"
          },
          {
            "name": "Seafood Stick",
            "price": "$1.80",
            "options": [
              {
                "label": "Quantity",
                "options": [
                  {
                    "name": "1 Pc",
                    "price": null
                  },
                  {
                    "name": "3 Pcs",
                    "price": "$2.70"
                  }
                ]
              }
            ]
          },
          {
            "name": "Crumbed Calamari Ring (Fresh)",
            "price": "$1.50",
            "options": [
              {
                "label": "Quantity",
                "options": [
                  {
                    "name": "1 Pc",
                    "price": null
                  },
                  {
                    "name": "3 Pcs",
                    "price": "$2.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Crumbed Prawn",
            "price": "$2.50"
          },
          {
            "name": "Battered King Prawn",
            "price": "$2.50"
          },
          {
            "name": "Scallop",
            "price": "$3.30"
          },
          {
            "name": "Oyster",
            "price": "$3.30"
          },
          {
            "name": "Fish Cake",
            "price": "$2.80"
          }
        ]
      },
      {
        "name": "HAMBURGERS",
        "items": [
          {
            "name": "Plain Burger",
            "price": "$8.00",
            "description": "Lettuce, Tomato Sauce",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "The Lot Burger",
            "price": "$12.00",
            "description": "Egg, Bacon, Cheese, Onion & Tomato",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Chicken Burger",
            "price": "$10.00",
            "description": "Lettuce, Cheese & Mayo",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Vegie Burger",
            "price": "$9.00",
            "description": "Vege Pattie, Lettuce, Cheese & Mayo",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Fish Burger",
            "price": "$11.00",
            "description": "Fry Flake, Lettuce & Tartar Sauce",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Steak Sandwich Plain",
            "price": "$10.00",
            "description": "Lettuce & Tomato Sauce",
            "subtitle": "Scotch Fillet",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Steak Sandwich The Lot",
            "price": "$14.00",
            "description": "Egg, Bacon, Cheese, Onion & Tomato",
            "subtitle": "Scotch Fillet",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "SOUVLAKI",
        "items": [
          {
            "name": "Lamb Souvlaki",
            "price": "$14.00",
            "description": "With Raw Onion, Tomato, Lettuce & Garlic Sauce",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Extra Meat",
                    "price": "$4.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  }
                ]
              }
            ]
          },
          {
            "name": "Chicken Souvlaki",
            "price": "$14.00",
            "description": "With Raw Onion, Tomato, Lettuce & Garlic Sauce",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Extra Meat",
                    "price": "$4.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  }
                ]
              }
            ]
          },
          {
            "name": "Mix Souvlaki",
            "price": "$14.00",
            "description": "With Raw Onion, Tomato, Lettuce & Garlic Sauce",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Extra Meat",
                    "price": "$4.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  }
                ]
              }
            ]
          },
          {
            "name": "Fish Souvlaki",
            "price": "$14.00",
            "description": "With Raw Onion, Tomato, Lettuce & Garlic Sauce",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Extra Meat",
                    "price": "$4.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "HSP",
        "items": [
          {
            "name": "HSP",
            "price": "$13.00",
            "options": [
              {
                "label": "Sauce",
                "options": [
                  {
                    "name": "BBQ Sauce",
                    "price": null
                  },
                  {
                    "name": "Tomato Sauce",
                    "price": null
                  },
                  {
                    "name": "Sweet Chilli Sauce",
                    "price": null
                  },
                  {
                    "name": "Hot Chilli Sauce",
                    "price": null
                  },
                  {
                    "name": "Garlic Sauce",
                    "price": null
                  },
                  {
                    "name": "Mayo",
                    "price": null
                  }
                ]
              },
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Cheese",
                    "price": "$2.00"
                  }
                ]
              },
              {
                "label": "Meat Options",
                "options": [
                  {
                    "name": "Chicken",
                    "price": null
                  },
                  {
                    "name": "Lamb",
                    "price": null
                  },
                  {
                    "name": "Mix",
                    "price": null
                  }
                ]
              }
            ]
          },
          {
            "name": "Parma and Chips",
            "price": "$18.00"
          }
        ]
      },
      {
        "name": "SAUCE",
        "items": [
          {
            "name": "Tomato Sauce",
            "price": "$1.00"
          },
          {
            "name": "Tartar",
            "price": "$1.00"
          },
          {
            "name": "Sweet Chilli",
            "price": "$1.00"
          },
          {
            "name": "BBQ Sauce",
            "price": "$1.00"
          },
          {
            "name": "Hot Chilli",
            "price": "$1.00"
          }
        ]
      },
      {
        "name": "DEALS",
        "items": [
          {
            "name": "Pack for One",
            "price": "$15.00",
            "description": "1 Flake, 1 Potato Cake, 1 Dim Sim and Chips",
            "options": [
              {
                "label": "Serving Option",
                "options": [
                  {
                    "name": "Grilled Extra 1 Fish",
                    "price": "$1.00"
                  }
                ]
              }
            ]
          },
          {
            "name": "Pack for Two",
            "price": "$29.00",
            "description": "2 Flakes, 2 Potato Cakes, 2 Dim Sim and Minimum Chips",
            "options": [
              {
                "label": "Serving Option",
                "options": [
                  {
                    "name": "Grilled Extra 2 Fishes",
                    "price": "$2.00"
                  }
                ]
              }
            ]
          },
          {
            "name": "Seafood Basket",
            "price": "$38.00",
            "description": "2 Flake, 2 Crumbed Prawn, 2 Seafood Sticks, 2 Calamari Rings, 2 Scallops and Minimum Chips",
            "options": [
              {
                "label": "Serving Option",
                "options": [
                  {
                    "name": "Grilled Extra 2 Fishes",
                    "price": "$2.00"
                  }
                ]
              }
            ]
          },
          {
            "name": "Family Pack",
            "price": "$59.00",
            "description": "4 Flake, 4 Potato Cake, 4 Dim Sim, 4 Seafood Stick, Minimum Chips, and 1.25L Soft Drinks",
            "options": [
              {
                "label": "Serving Option",
                "options": [
                  {
                    "name": "Grilled Extra 4 Fishes",
                    "price": "$4.00"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "DRINKS",
        "items": [
          {
            "name": "Bottled Water",
            "price": "$2.50"
          },
          {
            "name": "Coke Can",
            "price": "$2.70"
          },
          {
            "name": "Coke No Sugar Can",
            "price": "$2.70"
          },
          {
            "name": "Pepsi Max Can",
            "price": "$2.70"
          },
          {
            "name": "Solo Can",
            "price": "$2.70"
          },
          {
            "name": "Kirks Can",
            "price": "$2.70"
          },
          {
            "name": "Coke 1.25L",
            "price": "$5.70"
          },
          {
            "name": "Coke No Sugar 1.25L",
            "price": "$5.70"
          },
          {
            "name": "Pepsi Max 1.25L",
            "price": "$5.70"
          },
          {
            "name": "Solo 1.25L",
            "price": "$5.70"
          },
          {
            "name": "Kirks 1.25L",
            "price": "$5.70"
          },
          {
            "name": "Monster",
            "price": "$4.70"
          },
          {
            "name": "Powerade",
            "price": "$4.50"
          },
          {
            "name": "Bundaberg",
            "price": "$4.00"
          },
          {
            "name": "Juice",
            "price": "$2.50"
          }
        ]
      }
    ]
  },
  {
    "name": "LUNCH SPECIAL",
    "note": "A 2% service fee applies to all orders.",
    "hours": [
      {
        "day": "Tuesday",
        "open": "11:00",
        "close": "15:00"
      },
      {
        "day": "Wednesday",
        "open": "11:00",
        "close": "15:00"
      },
      {
        "day": "Thursday",
        "open": "11:00",
        "close": "15:00"
      },
      {
        "day": "Friday",
        "open": "11:00",
        "close": "15:00"
      },
      {
        "day": "Saturday",
        "open": "11:00",
        "close": "15:00"
      },
      {
        "day": "Sunday",
        "open": "11:00",
        "close": "15:00"
      }
    ],
    "categories": [
      {
        "name": "HAMBURGERS",
        "items": [
          {
            "name": "Plain Burger",
            "price": "$8.00",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              },
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "The Lot Burger",
            "price": "$12.00",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              },
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Chicken Burger",
            "price": "$10.00",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              },
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Vegie Burger",
            "price": "$9.00",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              },
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Fish Burger",
            "price": "$11.00",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              },
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Steak Sandwich Plain",
            "price": "$10.00",
            "description": "Scotch Fillet",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              },
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Steak Sandwich The Lot",
            "price": "$14.00",
            "description": "Scotch Fillet",
            "options": [
              {
                "label": "Extras",
                "options": [
                  {
                    "name": "Lettuce",
                    "price": "$0.50"
                  },
                  {
                    "name": "Tomato",
                    "price": "$0.50"
                  },
                  {
                    "name": "Onions",
                    "price": "$0.50"
                  },
                  {
                    "name": "Pineapple",
                    "price": "$1.00"
                  },
                  {
                    "name": "Beetroot",
                    "price": "$1.00"
                  },
                  {
                    "name": "Cheese",
                    "price": "$1.00"
                  },
                  {
                    "name": "Bacon",
                    "price": "$1.50"
                  }
                ]
              },
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "SOUVLAKI",
        "items": [
          {
            "name": "Lamb Souvlaki",
            "price": "$16.00",
            "options": [
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Chicken Souvlaki",
            "price": "$16.00",
            "options": [
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Mix Souvlaki",
            "price": "$16.00",
            "options": [
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          },
          {
            "name": "Fish Souvlaki",
            "price": "$16.00",
            "options": [
              {
                "label": "Make it a Meal",
                "options": [
                  {
                    "name": "Add Chips and Can of Coke",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Coke No Sugar",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Pepsi Max",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Solo",
                    "price": "$5.50"
                  },
                  {
                    "name": "Add Chips and Can of Kirks",
                    "price": "$5.50"
                  }
                ]
              }
            ]
          }
        ],
        "description": "Come with raw onion, tomato, lettuce & garlic sauce"
      }
    ]
  }
];
