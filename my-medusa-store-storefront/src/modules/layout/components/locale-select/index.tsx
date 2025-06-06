"use client"

import { useState, useEffect, Fragment } from "react"
import { getLocales, Locale, getSelectedLocale, setSelectedLocale } from "../../../../lib/data/locale"
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react"
import { ArrowRightMini } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

const LocaleSelect = () => {
  const [locales, setLocales] = useState<Locale[]>([])
  const [locale, setLocale] = useState<Locale | undefined>()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getLocales()
      .then(({ locales }) => {
        setLocales(locales)
      })
  }, [])

  useEffect(() => {
    if (!locales.length || locale) {
      return
    }

    getSelectedLocale().then((locale) => {
      const localeDetails = locales.find((l) => l.code === locale) 
      setLocale(localeDetails)
    })
  }, [locales])

  useEffect(() => {
    if (locale) {
      setSelectedLocale(locale.code)
    }
  }, [locale])

  const handleChange = (locale: Locale) => {
    setLocale(locale)
    setOpen(false)
  }

  // TODO add return statement
  return (
  <div
    className="flex justify-between"
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}
  >
    <div>
      <Listbox as="span" onChange={handleChange} defaultValue={locale}>
        <ListboxButton className="py-1 w-full">
          <div className="txt-compact-small flex items-start gap-x-2">
            <span>Language:</span>
            {locale && (
              <span className="txt-compact-small flex items-center gap-x-2">
                {locale.name}
              </span>
            )}
          </div>
        </ListboxButton>
        <div className="flex relative w-full min-w-[320px]">
          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              className="absolute -bottom-[calc(100%-36px)] left-0 xsmall:left-auto xsmall:right-0 max-h-[442px] overflow-y-scroll z-[900] bg-white drop-shadow-md text-small-regular uppercase text-black no-scrollbar rounded-rounded w-full"
              static
            >
              {locales?.map((l, index) => {
                return (
                  <ListboxOption
                    key={index}
                    value={l}
                    className="py-2 hover:bg-gray-200 px-3 cursor-pointer flex items-center gap-x-2"
                  >
                    {l.name}
                  </ListboxOption>
                )
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
    <ArrowRightMini
      className={clx(
        "transition-transform duration-150",
        open ? "-rotate-90" : ""
      )}
    />
  </div>
)
}

export default LocaleSelect