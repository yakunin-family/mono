import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from "react";
import { Command, CommandList, CommandItem } from "@package/ui";
import { CommandItem as CommandItemType } from "../extensions/SlashCommand";

interface SlashCommandMenuProps {
  items: CommandItemType[];
  command: (item: CommandItemType) => void;
}

export const SlashCommandMenu = forwardRef<any, SlashCommandMenuProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemsRef = useRef<Map<number, HTMLDivElement>>(new Map());

    const selectItem = useCallback(
      (index: number) => {
        const item = props.items[index];
        if (item) {
          props.command(item);
        }
      },
      [props],
    );

    const upHandler = useCallback(() => {
      setSelectedIndex((prev) =>
        prev <= 0 ? props.items.length - 1 : prev - 1,
      );
    }, [props.items.length]);

    const downHandler = useCallback(() => {
      setSelectedIndex((prev) =>
        prev >= props.items.length - 1 ? 0 : prev + 1,
      );
    }, [props.items.length]);

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex);
    }, [selectedIndex, selectItem]);

    useEffect(() => {
      setSelectedIndex(0);
      itemsRef.current.clear();
    }, [props.items]);

    useEffect(() => {
      const selectedItem = itemsRef.current.get(selectedIndex);
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    return (
      <div className="z-50 w-64 rounded-lg border bg-popover p-1.5 shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <Command>
          <CommandList>
            {props.items.length > 0 ? (
              props.items.map((item, index) => (
                <div
                  key={item.title}
                  ref={(el) => {
                    if (el) {
                      itemsRef.current.set(index, el);
                    }
                  }}
                >
                  <CommandItem
                    onSelect={() => selectItem(index)}
                    className={
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground cursor-pointer"
                        : "cursor-pointer"
                    }
                  >
                    <item.icon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    <span className="text-sm">{item.title}</span>
                  </CommandItem>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </CommandList>
        </Command>
      </div>
    );
  },
);

SlashCommandMenu.displayName = "SlashCommandMenu";
