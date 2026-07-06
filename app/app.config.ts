export default defineAppConfig({
  ui: {
    colors: {
      primary: "primary",
      secondary: "blue",
      neutral: "neutral",
    },
    button: {
      slots: {
        base: "font-medium",
      },
      variants: {
        size: {
          md: {
            label: "text-sm",
            leadingIcon: "size-3.5",
            trailingIcon: "size-3.5",
          },
        },
      },
      compoundVariants: [
        {
          size: "md",
          square: true,
          class: "p-2",
        },
      ],
      defaultVariants: {
        size: "md",
      },
    },
    input: {
      variants: {
        size: {
          xl: {
            base: "text-sm",
          },
        },
      },
      defaultVariants: {
        size: "xl",
        color: "secondary",
      },
    },
    textarea: {
      variants: {
        size: {
          md: {
            base: "px-3 py-2 text-base/5 gap-1.5",
            leading: "ps-3 inset-y-2",
            trailing: "pe-3 inset-y-2",
          },
        },
      },
    },
    select: {
      variants: {
        size: {
          md: {
            base: "px-3 py-2 text-sm gap-1.5",
            leading: "ps-3",
            trailing: "pe-3",
          },
        },
      },
    },
    selectMenu: {
      variants: {
        size: {
          md: {
            base: "px-3 py-2 text-sm gap-1.5",
            leading: "ps-3",
            trailing: "pe-3",
          },
        },
      },
    },
    inputMenu: {
      variants: {
        size: {
          xl: {
            base: "px-3 py-3 text-base/5 gap-1.5",
            leading: "ps-3",
            trailing: "pe-3",
          },
        },
      },
    },
    inputNumber: {
      variants: {
        size: {
          md: "px-3 py-2 text-base/5 gap-1.5",
        },
      },
    },
    card: {
      slots: {
        root: "shadow-xs",
      },
    },
    dashboardNavbar: {
      slots: {
        root: "bg-default/80 backdrop-blur-md supports-[backdrop-filter]:bg-default/60",
        icon: "size-4",
      },
    },
    dashboardSidebar: {
      slots: {
        root: "bg-muted/40",
        header: "border-b border-default",
        footer: "border-t border-default",
      },
    },
    navigationMenu: {
      compoundVariants: [
        {
          variant: "pill",
          active: true,
          highlight: false,
          color: "secondary",
          class: {
            link: "before:bg-secondary/10 font-medium",
          },
        },
      ],
    },
    table: {
      slots: {
        th: "text-xs uppercase tracking-wider text-muted font-medium",
        td: "text-default",
      },
    },
    modal: {
      slots: {
        overlay: "backdrop-blur-sm",
      },
    },
    badge: {
      slots: {
        base: "font-medium",
      },
    },
    alert: {
      slots: {
        root: "shadow-xs",
      },
    },
    inputTags: {
      slots: {
        base: "font-mono",
        itemText: "font-mono",
      },
      variants: {
        size: {
          xl: {
            base: "text-sm",
          },
        },
      },
      defaultVariants: {
        size: "xl",
        color: "secondary",
      },
    },
  },
});
